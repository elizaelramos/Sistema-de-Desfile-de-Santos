import { ErroApp, json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { abrirCategoria, fecharCategoria, revelarCategoria } from "@/lib/desfile";
import { esquemaAcaoCategoria } from "@/lib/validacao";

export const POST = rota(
  async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/categorias/[catId]">) => {
    const { id, catId } = await ctx.params;
    const evento = await exigirEventoDoOrganizador(id);
    if (evento.status === "ENCERRADO") throw new ErroApp("Evento encerrado");
    const { acao, motivo } = esquemaAcaoCategoria.parse(await request.json());

    if (acao === "abrir") await abrirCategoria(id, catId);
    if (acao === "fechar") await fecharCategoria(id, catId, motivo ? { motivo } : undefined);
    if (acao === "revelar") await revelarCategoria(id, catId);
    return json({ ok: true });
  },
);
