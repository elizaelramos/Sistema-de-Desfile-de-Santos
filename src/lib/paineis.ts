import { db } from "./db";
import { estadoAoVivo, filaDaCategoria, primeiroNome } from "./desfile";

type AoVivo = Awaited<ReturnType<typeof estadoAoVivo>>;
type P = { numero: number; nome: string; idade: number; santo: string } | null;

const dadosParticipante = (p: P) =>
  p && { numero: p.numero, nome: p.nome, idade: p.idade, santo: p.santo };

/** O pódio aparece depois da revelação, até o próximo participante ser liberado. */
function podio(ao: AoVivo, nome: (n: string) => string) {
  const r = ao.ultimaRevelada;
  if (!r?.reveladaEm) return null;
  const desfilouEm = ao.participanteAtual?.desfilouEm;
  if (desfilouEm && desfilouEm > r.reveladaEm) return null;
  return {
    categoria: r.nome,
    itens: r.resultados.map((x) => ({
      posicao: x.posicao,
      numero: x.participante.numero,
      nome: nome(x.participante.nome),
      santo: x.participante.santo,
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
  return {
    categoria: ao.categoriaAtual?.nome ?? null,
    atual: dadosParticipante(ao.participanteAtual),
    proximo: dadosParticipante(ao.proximo),
    podio: podio(ao, (n) => n),
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
    podio: podio(ao, nome),
  };
}

export type PainelCadastro = Awaited<ReturnType<typeof painelCadastro>>;
export type PainelFila = Awaited<ReturnType<typeof painelFila>>;
export type PainelLocutor = Awaited<ReturnType<typeof painelLocutor>>;
export type PainelJurado = Awaited<ReturnType<typeof painelJurado>>;
export type PainelPublico = NonNullable<Awaited<ReturnType<typeof painelPublico>>>;
