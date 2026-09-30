import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { cadastrarParticipante } from "@/lib/desfile";
import { esquemaParticipante } from "@/lib/validacao";

/** Busca rápida por número, nome ou santo. */
export const GET = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/participantes">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token, ["CADASTRO"]);
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const numero = /^\d+$/.test(q) ? Number(q) : undefined;

  const participantes = await db.participante.findMany({
    where: {
      eventoId: acesso.eventoId,
      ...(q && {
        OR: [
          ...(numero !== undefined ? [{ numero }] : []),
          { nome: { contains: q } },
          { santo: { contains: q } },
        ],
      }),
    },
    orderBy: { criadoEm: "desc" },
    take: 30,
    include: { categoria: { select: { nome: true } } },
  });
  return json(participantes);
});

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/participantes">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token, ["CADASTRO"]);
  const dados = esquemaParticipante.parse(await request.json());
  const participante = await cadastrarParticipante(acesso.eventoId, dados);
  return json(participante, { status: 201 });
});
