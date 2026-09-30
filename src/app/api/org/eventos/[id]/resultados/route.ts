import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";

/** Ranking completo das categorias fechadas, com médias por quesito. */
export const GET = rota(async (_req: Request, ctx: RouteContext<"/api/org/eventos/[id]/resultados">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);

  const quesitos = await db.quesito.findMany({ where: { eventoId: id }, orderBy: { ordem: "asc" } });
  const categorias = await db.categoria.findMany({
    where: { eventoId: id, status: { in: ["FECHADA", "REVELADA"] } },
    orderBy: { ordem: "asc" },
    include: {
      resultados: {
        orderBy: { posicao: "asc" },
        include: { participante: { include: { notas: true } } },
      },
    },
  });

  return json({
    quesitos,
    categorias: categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      status: c.status,
      fechadaEm: c.fechadaEm,
      reveladaEm: c.reveladaEm,
      resultados: c.resultados.map((r) => ({
        posicao: r.posicao,
        media: r.media,
        criterioDesempate: r.criterioDesempate,
        sorteioEm: r.sorteioEm,
        numero: r.participante.numero,
        nome: r.participante.nome,
        idade: r.participante.idade,
        santo: r.participante.santo,
        mediasQuesitos: quesitos.map((q) => {
          const v = r.participante.notas.filter((n) => n.quesitoId === q.id).map((n) => n.valor);
          return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
        }),
      })),
    })),
  });
});
