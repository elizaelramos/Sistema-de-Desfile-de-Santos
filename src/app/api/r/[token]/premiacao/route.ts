import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { encerrarPremiacao, iniciarPremiacao, revelarPosicao } from "@/lib/desfile";
import { invalidarPainelPublico } from "@/lib/paineis";
import { esquemaAcaoPremiacao } from "@/lib/validacao";

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/premiacao">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token, ["LOCUTOR"]);
  const dados = esquemaAcaoPremiacao.parse(await request.json());

  if (dados.acao === "iniciar") await iniciarPremiacao(acesso.eventoId, dados.categoriaId);
  if (dados.acao === "revelar") await revelarPosicao(acesso.eventoId, dados.categoriaId, dados.posicao);
  if (dados.acao === "encerrar") await encerrarPremiacao(acesso.eventoId);
  invalidarPainelPublico(acesso.evento.slugPublico);
  return json({ ok: true });
});
