import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { salvarCategorias } from "@/lib/eventos";
import { esquemaCategorias } from "@/lib/validacao";

export const PUT = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/categorias">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const { categorias } = esquemaCategorias.parse(await request.json());
  await salvarCategorias(id, categorias);
  return json({ ok: true });
});
