import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { liberarParticipante } from "@/lib/desfile";
import { esquemaLiberacaoManual } from "@/lib/validacao";

/** Plano B: libera a fila sem as notas de um jurado impedido, registrando o motivo. */
export const POST = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/liberar">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const { participanteId, motivo } = esquemaLiberacaoManual.parse(await request.json());
  await liberarParticipante(id, participanteId, { motivo });
  return json({ ok: true });
});
