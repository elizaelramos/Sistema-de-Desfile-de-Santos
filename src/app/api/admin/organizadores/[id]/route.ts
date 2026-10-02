import { json, rota } from "@/lib/api";
import { exigirSuperAdmin } from "@/lib/auth";
import { editarOrganizador } from "@/lib/organizadores";
import { esquemaEdicaoOrganizador } from "@/lib/validacao";

export const PATCH = rota(async (request: Request, ctx: RouteContext<"/api/admin/organizadores/[id]">) => {
  const { id } = await ctx.params;
  const admin = await exigirSuperAdmin();
  const dados = esquemaEdicaoOrganizador.parse(await request.json());
  await editarOrganizador(admin.id, id, dados);
  return json({ ok: true });
});
