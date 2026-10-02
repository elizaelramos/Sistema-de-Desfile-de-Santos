import { db } from "./db";
import { ErroApp } from "./api";
import { apurar } from "./apuracao";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export const CATEGORIAS_PADRAO = [
  { nome: "Baby", idadeMin: 0, idadeMax: 5 },
  { nome: "Infanto-juvenil", idadeMin: 6, idadeMax: 12 },
  { nome: "Jovem", idadeMin: 13, idadeMax: 29 },
  { nome: "Adulto", idadeMin: 30, idadeMax: 59 },
  { nome: "60+", idadeMin: 60, idadeMax: 150 },
];

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

// ---------------------------------------------------------------------------
// Cadastro
// ---------------------------------------------------------------------------

async function categoriaPorIdade(tx: Tx, eventoId: string, idade: number) {
  const categoria = await tx.categoria.findFirst({
    where: { eventoId, idadeMin: { lte: idade }, idadeMax: { gte: idade } },
    orderBy: { ordem: "asc" },
  });
  if (!categoria) throw new ErroApp(`Nenhuma categoria aceita a idade ${idade}`);
  if (categoria.status === "FECHADA" || categoria.status === "REVELADA")
    throw new ErroApp(`A categoria ${categoria.nome} já foi encerrada`);
  return categoria;
}

async function fimDaFila(tx: Tx, categoriaId: string) {
  const ultimo = await tx.participante.aggregate({
    where: { categoriaId },
    _max: { posicaoFila: true },
  });
  return (ultimo._max.posicaoFila ?? 0) + 1;
}

/**
 * Categoria aguardando: fila em ordem numérica (posição = número).
 * Categoria em andamento: quem chega entra no fim da fila.
 */
async function posicaoInicial(
  tx: Tx,
  categoria: { id: string; status: string },
  numero: number,
) {
  return categoria.status === "EM_ANDAMENTO" ? fimDaFila(tx, categoria.id) : numero;
}

export type DadosParticipante = { numero: number; nome: string; idade: number; santo: string };

export async function cadastrarParticipante(eventoId: string, dados: DadosParticipante) {
  return db.$transaction(async (tx) => {
    const existente = await tx.participante.findUnique({
      where: { eventoId_numero: { eventoId, numero: dados.numero } },
    });
    if (existente)
      throw new ErroApp(`O número ${dados.numero} já está com ${existente.nome}`);
    const categoria = await categoriaPorIdade(tx, eventoId, dados.idade);
    return tx.participante.create({
      data: {
        eventoId,
        categoriaId: categoria.id,
        ...dados,
        posicaoFila: await posicaoInicial(tx, categoria, dados.numero),
      },
      include: { categoria: { select: { nome: true } } },
    });
  });
}

export async function editarParticipante(
  eventoId: string,
  participanteId: string,
  dados: DadosParticipante,
) {
  return db.$transaction(async (tx) => {
    const atual = await tx.participante.findFirst({
      where: { id: participanteId, eventoId },
      include: { categoria: true },
    });
    if (!atual) throw new ErroApp("Participante não encontrado", 404);

    if (dados.numero !== atual.numero) {
      const outro = await tx.participante.findUnique({
        where: { eventoId_numero: { eventoId, numero: dados.numero } },
      });
      if (outro) throw new ErroApp(`O número ${dados.numero} já está com ${outro.nome}`);
    }

    let categoriaId = atual.categoriaId;
    let posicaoFila = atual.posicaoFila;
    const faixaAtual = dados.idade >= atual.categoria.idadeMin && dados.idade <= atual.categoria.idadeMax;

    if (!faixaAtual) {
      if (atual.status === "DESFILOU")
        throw new ErroApp("Participante já desfilou; não é possível trocar de categoria");
      const nova = await categoriaPorIdade(tx, eventoId, dados.idade);
      categoriaId = nova.id;
      posicaoFila = await posicaoInicial(tx, nova, dados.numero);
    } else if (atual.categoria.status === "AGUARDANDO") {
      posicaoFila = dados.numero;
    }

    return tx.participante.update({
      where: { id: participanteId },
      data: { ...dados, categoriaId, posicaoFila },
      include: { categoria: { select: { nome: true } } },
    });
  });
}

// ---------------------------------------------------------------------------
// Estado ao vivo
// ---------------------------------------------------------------------------

async function obterEstado(tx: Tx | typeof db, eventoId: string) {
  return (
    (await tx.estadoDesfile.findUnique({ where: { eventoId } })) ??
    (await tx.estadoDesfile.create({ data: { eventoId } }))
  );
}

/** Obtém o estado com lock de linha, serializando ações concorrentes da fila. */
async function travarEstado(tx: Tx, eventoId: string) {
  await obterEstado(tx, eventoId);
  await tx.$queryRaw`SELECT eventoId FROM EstadoDesfile WHERE eventoId = ${eventoId} FOR UPDATE`;
  return tx.estadoDesfile.findUniqueOrThrow({ where: { eventoId } });
}

/** Jurados que ainda não confirmaram todas as notas do participante. */
export async function juradosPendentes(tx: Tx | typeof db, eventoId: string, participanteId: string) {
  const [jurados, totalQuesitos, notas] = await Promise.all([
    tx.jurado.findMany({ where: { eventoId }, orderBy: { numero: "asc" } }),
    tx.quesito.count({ where: { eventoId } }),
    tx.nota.groupBy({ by: ["juradoId"], where: { participanteId }, _count: true }),
  ]);
  const contagem = new Map(notas.map((n) => [n.juradoId, n._count]));
  return jurados
    .filter((j) => (contagem.get(j.id) ?? 0) < totalQuesitos)
    .map((j) => ({ id: j.id, numero: j.numero, nome: j.nome }));
}

export async function filaDaCategoria(categoriaId: string) {
  return db.participante.findMany({
    where: { categoriaId },
    orderBy: [{ posicaoFila: "asc" }, { numero: "asc" }],
  });
}

/** Resumo do desfile usado por fila, locutor, telão e organizador. */
export async function estadoAoVivo(eventoId: string) {
  const estado = await obterEstado(db, eventoId);

  const categoriaAtual = estado.categoriaAtualId
    ? await db.categoria.findUnique({ where: { id: estado.categoriaAtualId } })
    : null;
  const participanteAtual = estado.participanteAtualId
    ? await db.participante.findUnique({ where: { id: estado.participanteAtualId } })
    : null;

  let proximo = null;
  if (categoriaAtual) {
    proximo = await db.participante.findFirst({
      where: { categoriaId: categoriaAtual.id, status: { not: "DESFILOU" } },
      orderBy: [{ posicaoFila: "asc" }, { numero: "asc" }],
    });
  }

  const pendentes = participanteAtual
    ? await juradosPendentes(db, eventoId, participanteAtual.id)
    : [];

  const ultimaRevelada = await db.categoria.findFirst({
    where: { eventoId, status: "REVELADA" },
    orderBy: { reveladaEm: "desc" },
    include: {
      resultados: {
        where: { posicao: { lte: 3 } },
        orderBy: { posicao: "asc" },
        include: { participante: true },
      },
    },
  });

  return { categoriaAtual, participanteAtual, proximo, pendentes, ultimaRevelada };
}

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

export async function marcarPresenca(
  eventoId: string,
  participanteId: string,
  status: "PRESENTE" | "AUSENTE",
) {
  return db.$transaction(async (tx) => {
    const p = await tx.participante.findFirst({ where: { id: participanteId, eventoId } });
    if (!p) throw new ErroApp("Participante não encontrado", 404);
    if (p.status === "DESFILOU") throw new ErroApp("Participante já desfilou");
    return tx.participante.update({
      where: { id: p.id },
      data:
        status === "AUSENTE"
          ? { status, posicaoFila: await fimDaFila(tx, p.categoriaId) }
          : { status },
    });
  });
}

/**
 * Libera o participante para desfilar. Bloqueado enquanto algum jurado não
 * confirmou as notas do participante atual (trava de avaliação), a menos que
 * o organizador force a liberação informando o motivo.
 */
export async function liberarParticipante(
  eventoId: string,
  participanteId: string,
  forcar?: { motivo: string },
) {
  return db.$transaction(async (tx) => {
    const estado = await travarEstado(tx, eventoId);
    const p = await tx.participante.findFirst({
      where: { id: participanteId, eventoId },
      include: { categoria: true },
    });
    if (!p) throw new ErroApp("Participante não encontrado", 404);
    if (p.categoria.status !== "EM_ANDAMENTO" || estado.categoriaAtualId !== p.categoriaId)
      throw new ErroApp("A categoria deste participante não está em andamento");
    if (p.status === "DESFILOU") throw new ErroApp("Participante já desfilou");

    if (estado.participanteAtualId) {
      const pendentes = await juradosPendentes(tx, eventoId, estado.participanteAtualId);
      if (pendentes.length && !forcar)
        throw new ErroApp(
          `Aguardando ${pendentes.map((j) => `Jurado ${j.numero}`).join(", ")}`,
          409,
        );
      if (pendentes.length && forcar) {
        const atual = await tx.participante.findUnique({ where: { id: estado.participanteAtualId } });
        await tx.ocorrencia.create({
          data: {
            eventoId,
            tipo: "LIBERACAO_MANUAL",
            descricao: `Fila liberada sem notas de ${pendentes
              .map((j) => `Jurado ${j.numero}`)
              .join(", ")} para o nº ${atual?.numero} (${atual?.nome}). Motivo: ${forcar.motivo}`,
          },
        });
      }
    }

    await tx.participante.update({
      where: { id: p.id },
      data: { status: "DESFILOU", desfilouEm: new Date() },
    });
    await tx.estadoDesfile.update({
      where: { eventoId },
      data: { participanteAtualId: p.id },
    });
  });
}

// ---------------------------------------------------------------------------
// Categorias (organizador)
// ---------------------------------------------------------------------------

export async function abrirCategoria(eventoId: string, categoriaId: string) {
  return db.$transaction(async (tx) => {
    await travarEstado(tx, eventoId);
    const emAndamento = await tx.categoria.findFirst({
      where: { eventoId, status: "EM_ANDAMENTO" },
    });
    if (emAndamento) throw new ErroApp(`Feche a categoria ${emAndamento.nome} antes`);
    const cat = await tx.categoria.findFirst({ where: { id: categoriaId, eventoId } });
    if (!cat) throw new ErroApp("Categoria não encontrada", 404);
    if (cat.status !== "AGUARDANDO") throw new ErroApp("Esta categoria já foi aberta");

    await tx.categoria.update({ where: { id: cat.id }, data: { status: "EM_ANDAMENTO" } });
    await tx.estadoDesfile.update({
      where: { eventoId },
      data: { categoriaAtualId: cat.id, participanteAtualId: null },
    });
  });
}

export async function fecharCategoria(
  eventoId: string,
  categoriaId: string,
  forcar?: { motivo: string },
) {
  return db.$transaction(async (tx) => {
    const evento = await tx.evento.findUniqueOrThrow({ where: { id: eventoId } });
    const cat = await tx.categoria.findFirst({ where: { id: categoriaId, eventoId } });
    if (!cat) throw new ErroApp("Categoria não encontrada", 404);
    if (cat.status !== "EM_ANDAMENTO") throw new ErroApp("A categoria não está em andamento");

    const estado = await travarEstado(tx, eventoId);
    if (estado.participanteAtualId) {
      const pendentes = await juradosPendentes(tx, eventoId, estado.participanteAtualId);
      if (pendentes.length && !forcar)
        throw new ErroApp(
          `Aguardando ${pendentes.map((j) => `Jurado ${j.numero}`).join(", ")}`,
          409,
        );
      if (pendentes.length && forcar)
        await tx.ocorrencia.create({
          data: {
            eventoId,
            tipo: "FECHAMENTO_MANUAL",
            descricao: `Categoria ${cat.nome} fechada sem notas de ${pendentes
              .map((j) => `Jurado ${j.numero}`)
              .join(", ")} para o último participante. Motivo: ${forcar.motivo}`,
          },
        });
    }

    const quesitos = await tx.quesito.findMany({ where: { eventoId }, orderBy: { ordem: "asc" } });
    // Ausentes que não desfilaram ficam fora da apuração.
    const participantes = await tx.participante.findMany({
      where: { categoriaId, status: "DESFILOU" },
      include: { notas: true },
    });

    const linhas = apurar(
      participantes.map((p) => ({
        participanteId: p.id,
        idade: p.idade,
        notasPorQuesito: quesitos.map((q) =>
          p.notas.filter((n) => n.quesitoId === q.id).map((n) => n.valor),
        ),
      })),
      { nomesQuesitos: quesitos.map((q) => q.nome), desempateIdade: evento.desempateIdade },
    );

    const agora = new Date();
    await tx.resultado.deleteMany({ where: { categoriaId } });
    await tx.resultado.createMany({
      data: linhas.map((l) => ({
        categoriaId,
        participanteId: l.participanteId,
        posicao: l.posicao,
        media: l.media,
        criterioDesempate: l.criterioDesempate,
        sorteioEm: l.sorteio ? agora : null,
      })),
    });

    await tx.categoria.update({
      where: { id: categoriaId },
      data: { status: "FECHADA", fechadaEm: agora },
    });
    await tx.estadoDesfile.update({
      where: { eventoId },
      data: { categoriaAtualId: null, participanteAtualId: null },
    });
  });
}

export async function revelarCategoria(eventoId: string, categoriaId: string) {
  const cat = await db.categoria.findFirst({ where: { id: categoriaId, eventoId } });
  if (!cat) throw new ErroApp("Categoria não encontrada", 404);
  if (cat.status !== "FECHADA" && cat.status !== "REVELADA")
    throw new ErroApp("Feche a categoria antes de revelar");
  // Revelar de novo reexibe o pódio no telão.
  await db.categoria.update({
    where: { id: cat.id },
    data: { status: "REVELADA", reveladaEm: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Notas (jurado)
// ---------------------------------------------------------------------------

export async function confirmarNotas(
  eventoId: string,
  juradoId: string,
  participanteId: string,
  notas: { quesitoId: string; valor: number }[],
) {
  return db.$transaction(async (tx) => {
    const p = await tx.participante.findFirst({
      where: { id: participanteId, eventoId },
      include: { categoria: true },
    });
    if (!p) throw new ErroApp("Participante não encontrado", 404);
    if (p.status !== "DESFILOU") throw new ErroApp("Este participante ainda não desfilou");
    if (p.categoria.status !== "EM_ANDAMENTO")
      throw new ErroApp("A categoria foi fechada; as notas estão travadas");

    const quesitos = await tx.quesito.findMany({ where: { eventoId } });
    const ids = new Set(quesitos.map((q) => q.id));
    const recebidos = new Set(notas.map((n) => n.quesitoId));
    if (recebidos.size !== ids.size || [...recebidos].some((id) => !ids.has(id)))
      throw new ErroApp("Dê nota para todos os quesitos");

    const agora = new Date();
    for (const n of notas) {
      await tx.nota.upsert({
        where: {
          participanteId_juradoId_quesitoId: { participanteId, juradoId, quesitoId: n.quesitoId },
        },
        create: { participanteId, juradoId, quesitoId: n.quesitoId, valor: n.valor, confirmadaEm: agora },
        update: { valor: n.valor, confirmadaEm: agora },
      });
    }
  });
}
