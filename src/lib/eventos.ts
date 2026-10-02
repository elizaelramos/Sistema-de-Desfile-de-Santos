import { db } from "./db";
import { ErroApp } from "./api";
import { gerarSlug, gerarToken } from "./tokens";
import { CATEGORIAS_PADRAO } from "./desfile";
import type { DesempateIdade, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

const FUNCOES_FIXAS = ["FILA", "LOCUTOR"] as const;

export type DadosNovoEvento = { nome: string; data: Date; local: string };

async function criarAcessosFixos(tx: Tx, eventoId: string) {
  await tx.acesso.createMany({
    data: FUNCOES_FIXAS.map((funcao) => ({ eventoId, funcao, token: gerarToken() })),
  });
}

export async function criarEvento(organizadorId: string, dados: DadosNovoEvento) {
  return db.$transaction(async (tx) => {
    const evento = await tx.evento.create({
      data: { organizadorId, ...dados, slugPublico: gerarSlug() },
    });
    await tx.categoria.createMany({
      data: CATEGORIAS_PADRAO.map((c, i) => ({ ...c, eventoId: evento.id, ordem: i + 1 })),
    });
    await criarAcessosFixos(tx, evento.id);
    await tx.estadoDesfile.create({ data: { eventoId: evento.id } });
    await sincronizarCadastradores(tx, evento.id, 1);
    await sincronizarJurados(tx, evento.id, 3);
    return evento;
  });
}

/** Copia categorias, quesitos, cadastradores, jurados e regras para um novo evento. */
export async function duplicarEvento(eventoId: string, dados: DadosNovoEvento) {
  const origem = await db.evento.findUniqueOrThrow({
    where: { id: eventoId },
    include: { categorias: true, quesitos: true, jurados: true },
  });
  const cadastradores = await db.acesso.count({ where: { eventoId, funcao: "CADASTRO" } });
  return db.$transaction(async (tx) => {
    const evento = await tx.evento.create({
      data: {
        organizadorId: origem.organizadorId,
        ...dados,
        slugPublico: gerarSlug(),
        desempateIdade: origem.desempateIdade,
        exibirPrimeiroNome: origem.exibirPrimeiroNome,
      },
    });
    await tx.categoria.createMany({
      data: origem.categorias.map(({ nome, idadeMin, idadeMax, ordem }) => ({
        eventoId: evento.id,
        nome,
        idadeMin,
        idadeMax,
        ordem,
      })),
    });
    await tx.quesito.createMany({
      data: origem.quesitos.map(({ nome, ordem }) => ({ eventoId: evento.id, nome, ordem })),
    });
    await criarAcessosFixos(tx, evento.id);
    await tx.estadoDesfile.create({ data: { eventoId: evento.id } });
    await sincronizarCadastradores(tx, evento.id, Math.max(cadastradores, 1));
    await sincronizarJurados(tx, evento.id, origem.jurados.length);
    return evento;
  });
}

/** Ajusta a quantidade de jurados; cada um recebe um QR Code individual. */
export async function sincronizarJurados(tx: Tx, eventoId: string, quantidade: number) {
  const jurados = await tx.jurado.findMany({
    where: { eventoId },
    orderBy: { numero: "asc" },
    include: { _count: { select: { notas: true } } },
  });

  for (let numero = jurados.length + 1; numero <= quantidade; numero++) {
    const jurado = await tx.jurado.create({ data: { eventoId, numero } });
    await tx.acesso.create({
      data: { eventoId, funcao: "JURADO", numero, juradoId: jurado.id, token: gerarToken() },
    });
  }

  const excedentes = jurados.filter((j) => j.numero > quantidade);
  if (excedentes.some((j) => j._count.notas > 0))
    throw new ErroApp("Não é possível remover jurados que já deram notas");
  if (excedentes.length)
    await tx.jurado.deleteMany({ where: { id: { in: excedentes.map((j) => j.id) } } });
}

/** Ajusta a quantidade de cadastradores; cada um recebe um QR Code individual. */
export async function sincronizarCadastradores(tx: Tx, eventoId: string, quantidade: number) {
  const atuais = await tx.acesso.count({ where: { eventoId, funcao: "CADASTRO" } });
  for (let numero = atuais + 1; numero <= quantidade; numero++)
    await tx.acesso.create({ data: { eventoId, funcao: "CADASTRO", numero, token: gerarToken() } });
  // Os participantes não ficam presos ao cadastrador, então removê-los é sempre seguro.
  await tx.acesso.deleteMany({ where: { eventoId, funcao: "CADASTRO", numero: { gt: quantidade } } });
}

export async function atualizarEvento(
  eventoId: string,
  dados: {
    nome: string;
    data: Date;
    local: string;
    desempateIdade: DesempateIdade;
    exibirPrimeiroNome: boolean;
    jurados: number;
    cadastradores: number;
  },
) {
  const { jurados, cadastradores, ...campos } = dados;
  await db.$transaction(async (tx) => {
    await tx.evento.update({ where: { id: eventoId }, data: campos });
    await sincronizarCadastradores(tx, eventoId, cadastradores);
    await sincronizarJurados(tx, eventoId, jurados);
  });
}

export async function salvarCategorias(
  eventoId: string,
  categorias: { id?: string; nome: string; idadeMin: number; idadeMax: number }[],
) {
  for (const c of categorias)
    if (c.idadeMin > c.idadeMax) throw new ErroApp(`Faixa de idade inválida em ${c.nome}`);
  const ordenadas = [...categorias].sort((a, b) => a.idadeMin - b.idadeMin);
  for (let i = 1; i < ordenadas.length; i++)
    if (ordenadas[i].idadeMin <= ordenadas[i - 1].idadeMax)
      throw new ErroApp(`As faixas de ${ordenadas[i - 1].nome} e ${ordenadas[i].nome} se sobrepõem`);

  await db.$transaction(async (tx) => {
    const atuais = await tx.categoria.findMany({
      where: { eventoId },
      include: { _count: { select: { participantes: true } } },
    });
    const mantidas = new Set(categorias.map((c) => c.id).filter(Boolean));

    for (const atual of atuais) {
      if (mantidas.has(atual.id)) continue;
      if (atual._count.participantes > 0)
        throw new ErroApp(`A categoria ${atual.nome} tem participantes e não pode ser removida`);
      await tx.categoria.delete({ where: { id: atual.id } });
    }

    for (const [i, c] of categorias.entries()) {
      const dados = { nome: c.nome, idadeMin: c.idadeMin, idadeMax: c.idadeMax, ordem: i + 1 };
      const atual = atuais.find((a) => a.id === c.id);
      if (!atual) {
        await tx.categoria.create({ data: { ...dados, eventoId } });
        continue;
      }
      const mudouFaixa = atual.idadeMin !== c.idadeMin || atual.idadeMax !== c.idadeMax;
      if (mudouFaixa && atual._count.participantes > 0)
        throw new ErroApp(`A faixa de ${atual.nome} não pode mudar: já há participantes cadastrados`);
      await tx.categoria.update({ where: { id: atual.id }, data: dados });
    }
  });
}

export async function salvarQuesitos(eventoId: string, quesitos: { id?: string; nome: string }[]) {
  const temNotas = await db.nota.count({ where: { quesito: { eventoId } } });
  await db.$transaction(async (tx) => {
    const atuais = await tx.quesito.findMany({ where: { eventoId } });
    const mantidos = new Set(quesitos.map((q) => q.id).filter(Boolean));
    const removidos = atuais.filter((a) => !mantidos.has(a.id));
    const novos = quesitos.filter((q) => !q.id);
    // Com notas lançadas, só é permitido renomear e reordenar.
    if (temNotas && (removidos.length || novos.length))
      throw new ErroApp("Já existem notas; só é possível renomear ou reordenar os quesitos");

    await tx.quesito.deleteMany({ where: { id: { in: removidos.map((r) => r.id) } } });
    for (const [i, q] of quesitos.entries()) {
      if (q.id) await tx.quesito.update({ where: { id: q.id }, data: { nome: q.nome, ordem: i + 1 } });
      else await tx.quesito.create({ data: { eventoId, nome: q.nome, ordem: i + 1 } });
    }
  });
}

/** Troca o token do QR Code; o anterior deixa de funcionar e as sessões caem. */
export async function regenerarAcesso(eventoId: string, acessoId: string) {
  const acesso = await db.acesso.findFirst({ where: { id: acessoId, eventoId } });
  if (!acesso) throw new ErroApp("Acesso não encontrado", 404);
  await db.$transaction([
    db.sessao.deleteMany({ where: { acessoId } }),
    db.acesso.update({ where: { id: acessoId }, data: { token: gerarToken() } }),
  ]);
}
