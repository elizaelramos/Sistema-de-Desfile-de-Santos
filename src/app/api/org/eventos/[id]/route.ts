import { z } from "zod";
import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { estadoAoVivo } from "@/lib/desfile";
import { atualizarEvento } from "@/lib/eventos";
import { esquemaEvento } from "@/lib/validacao";

/** Tudo que o painel do organizador precisa, em uma chamada (usada no polling). */
export const GET = rota(async (_req: Request, ctx: RouteContext<"/api/org/eventos/[id]">) => {
  const { id } = await ctx.params;
  const evento = await exigirEventoDoOrganizador(id);

  const [categorias, quesitos, jurados, contagens, ao, ocorrencias] = await Promise.all([
    db.categoria.findMany({ where: { eventoId: id }, orderBy: { ordem: "asc" } }),
    db.quesito.findMany({ where: { eventoId: id }, orderBy: { ordem: "asc" } }),
    db.jurado.findMany({ where: { eventoId: id }, orderBy: { numero: "asc" } }),
    db.participante.groupBy({ by: ["categoriaId", "status"], where: { eventoId: id }, _count: true }),
    estadoAoVivo(id),
    db.ocorrencia.findMany({ where: { eventoId: id }, orderBy: { criadoEm: "desc" }, take: 20 }),
  ]);

  const porCategoria = categorias.map((c) => {
    const linhas = contagens.filter((l) => l.categoriaId === c.id);
    const total = linhas.reduce((s, l) => s + l._count, 0);
    const desfilaram = linhas.find((l) => l.status === "DESFILOU")?._count ?? 0;
    const ausentes = linhas.find((l) => l.status === "AUSENTE")?._count ?? 0;
    return { ...c, total, desfilaram, ausentes };
  });

  return json({
    evento,
    categorias: porCategoria,
    quesitos,
    jurados,
    aoVivo: ao,
    ocorrencias,
  });
});

const esquemaPatch = z.union([
  esquemaEvento,
  z.object({ status: z.enum(["ATIVO", "ENCERRADO"]) }),
]);

export const PATCH = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const dados = esquemaPatch.parse(await request.json());
  if ("status" in dados) await db.evento.update({ where: { id }, data: { status: dados.status } });
  else await atualizarEvento(id, dados);
  return json({ ok: true });
});
