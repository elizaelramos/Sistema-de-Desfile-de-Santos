import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { confirmarNotas } from "@/lib/desfile";
import { esquemaNotas } from "@/lib/validacao";

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/notas">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token, ["JURADO"]);
  const { participanteId, notas } = esquemaNotas.parse(await request.json());
  await confirmarNotas(acesso.eventoId, acesso.juradoId!, participanteId, notas);
  return json({ ok: true });
});
