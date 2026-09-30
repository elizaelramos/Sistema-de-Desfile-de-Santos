import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { duplicarEvento } from "@/lib/eventos";
import { esquemaNovoEvento } from "@/lib/validacao";

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/duplicar">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const dados = esquemaNovoEvento.parse(await request.json());
  const evento = await duplicarEvento(id, dados);
  return json(evento, { status: 201 });
});
