import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { salvarQuesitos } from "@/lib/eventos";
import { esquemaQuesitos } from "@/lib/validacao";

export const PUT = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/quesitos">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const { quesitos } = esquemaQuesitos.parse(await request.json());
  await salvarQuesitos(id, quesitos);
  return json({ ok: true });
});
