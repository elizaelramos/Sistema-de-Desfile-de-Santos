import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { liberarParticipante, marcarPresenca } from "@/lib/desfile";
import { esquemaAcaoFila } from "@/lib/validacao";

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/fila">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token, ["FILA"]);
  const { acao, participanteId } = esquemaAcaoFila.parse(await request.json());

  if (acao === "liberar") await liberarParticipante(acesso.eventoId, participanteId);
  else await marcarPresenca(acesso.eventoId, participanteId, acao === "presente" ? "PRESENTE" : "AUSENTE");
  return json({ ok: true });
});
