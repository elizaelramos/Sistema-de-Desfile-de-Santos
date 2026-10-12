import { db } from "./db";
import { estadoAoVivo, filaDaCategoria, podioDaCategoria, primeiroNome } from "./desfile";

type AoVivo = Awaited<ReturnType<typeof estadoAoVivo>>;
type P = { numero: number; nome: string; idade: number; santo: string } | null;

const dadosParticipante = (p: P) =>
  p && { numero: p.numero, nome: p.nome, idade: p.idade, santo: p.santo };

/**
 * Tela de premiação do telão: só leva nome, número e santo das posições que o
 * locutor já revelou, para não vazar o resultado antes da hora.
 */
function premiacaoPublica(ao: AoVivo, nome: (n: string) => string) {
  const p = ao.premiacao;
  if (!p) return null;
  return {
    categoria: p.categoria.nome,
    itens: p.resultados.map((r) => ({
      posicao: r.posicao,
      revelado: p.reveladas.includes(r.posicao)
        ? { numero: r.participante.numero, nome: nome(r.participante.nome), santo: r.participante.santo }
        : null,
    })),
  };
}

export async function painelCadastro(eventoId: string) {
  const categorias = await db.categoria.findMany({ where: { eventoId }, orderBy: { ordem: "asc" } });
  return {
    categorias: categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      idadeMin: c.idadeMin,
      idadeMax: c.idadeMax,
      status: c.status,
    })),
  };
}

export async function painelFila(eventoId: string) {
  const ao = await estadoAoVivo(eventoId);
  const fila = ao.categoriaAtual ? await filaDaCategoria(ao.categoriaAtual.id) : [];
  return {
    categoria: ao.categoriaAtual && { id: ao.categoriaAtual.id, nome: ao.categoriaAtual.nome },
    atual: ao.participanteAtual && { id: ao.participanteAtual.id, ...dadosParticipante(ao.participanteAtual) },
    pendentes: ao.pendentes,
    fila: fila.map((p) => ({
      id: p.id,
      numero: p.numero,
      nome: p.nome,
      idade: p.idade,
      santo: p.santo,
      status: p.status,
    })),
  };
}

export async function painelLocutor(eventoId: string) {
  const ao = await estadoAoVivo(eventoId);
  // Resultados liberados pelo coordenador; o locutor conduz a premiação de cada um.
  const liberadas = await db.categoria.findMany({
    where: { eventoId, status: "REVELADA" },
    orderBy: { ordem: "asc" },
  });
  const premiacoes = await Promise.all(
    liberadas.map(async (c) => {
      const noTelao = ao.premiacao?.categoria.id === c.id;
      return {
        categoriaId: c.id,
        categoria: c.nome,
        noTelao,
        itens: (await podioDaCategoria(c.id)).map((r) => ({
          posicao: r.posicao,
          ...dadosParticipante(r.participante)!,
          revelado: noTelao && ao.premiacao!.reveladas.includes(r.posicao),
        })),
      };
    }),
  );
  return {
    categoria: ao.categoriaAtual?.nome ?? null,
    atual: dadosParticipante(ao.participanteAtual),
    proximo: dadosParticipante(ao.proximo),
    premiacoes,
  };
}

export async function painelJurado(eventoId: string, juradoId: string) {
  const [ao, quesitos] = await Promise.all([
    estadoAoVivo(eventoId),
    db.quesito.findMany({ where: { eventoId }, orderBy: { ordem: "asc" } }),
  ]);

  // Participantes já avaliados por este jurado na categoria em andamento (podem ser corrigidos).
  const avaliados = ao.categoriaAtual
    ? await db.participante.findMany({
        where: { categoriaId: ao.categoriaAtual.id, notas: { some: { juradoId } } },
        orderBy: { desfilouEm: "desc" },
        include: { notas: { where: { juradoId } } },
      })
    : [];

  const atual = ao.participanteAtual;
  const notasAtual = atual
    ? await db.nota.findMany({ where: { participanteId: atual.id, juradoId } })
    : [];
  const confirmado = notasAtual.length >= quesitos.length && quesitos.length > 0;

  return {
    categoria: ao.categoriaAtual?.nome ?? null,
    quesitos: quesitos.map((q) => ({ id: q.id, nome: q.nome })),
    atual: atual && {
      id: atual.id,
      numero: atual.numero,
      nome: atual.nome,
      santo: atual.santo,
      confirmado,
      notas: Object.fromEntries(notasAtual.map((n) => [n.quesitoId, n.valor])),
    },
    avaliados: avaliados.map((p) => ({
      id: p.id,
      numero: p.numero,
      nome: p.nome,
      santo: p.santo,
      notas: Object.fromEntries(p.notas.map((n) => [n.quesitoId, n.valor])),
    })),
  };
}

export async function painelPublico(slug: string) {
  const evento = await db.evento.findUnique({ where: { slugPublico: slug } });
  if (!evento) return null;
  const ao = await estadoAoVivo(evento.id);
  const nome = evento.exibirPrimeiroNome ? primeiroNome : (n: string) => n;
  const atual = ao.participanteAtual;
  return {
    evento: { nome: evento.nome, local: evento.local, encerrado: evento.status === "ENCERRADO" },
    categoria: ao.categoriaAtual?.nome ?? null,
    atual: atual && { numero: atual.numero, nome: nome(atual.nome), santo: atual.santo },
    premiacao: premiacaoPublica(ao, nome),
  };
}

// Cache em memória: com centenas de celulares consultando o telão,
// o banco recebe no máximo uma consulta a cada 2 s por evento.
const TTL_MS = 2000;
const cachePublico = new Map<string, { expira: number; dados: PainelPublico | null }>();

export async function painelPublicoEmCache(slug: string) {
  let item = cachePublico.get(slug);
  if (!item || item.expira < Date.now()) {
    item = { expira: Date.now() + TTL_MS, dados: await painelPublico(slug) };
    cachePublico.set(slug, item);
  }
  return item.dados;
}

/** Descarta o cache para o telão refletir na hora uma ação do locutor. */
export function invalidarPainelPublico(slug: string) {
  cachePublico.delete(slug);
}

export type PainelCadastro = Awaited<ReturnType<typeof painelCadastro>>;
export type PainelFila = Awaited<ReturnType<typeof painelFila>>;
export type PainelLocutor = Awaited<ReturnType<typeof painelLocutor>>;
export type PainelJurado = Awaited<ReturnType<typeof painelJurado>>;
export type PainelPublico = NonNullable<Awaited<ReturnType<typeof painelPublico>>>;
