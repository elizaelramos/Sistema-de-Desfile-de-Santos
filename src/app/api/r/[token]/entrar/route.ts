import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { esquemaEntrar } from "@/lib/validacao";

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/entrar">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token);
  const { nome } = esquemaEntrar.parse(await request.json());
  const sessao = await db.sessao.create({ data: { acessoId: acesso.id, nomePessoa: nome } });
  if (acesso.juradoId) await db.jurado.update({ where: { id: acesso.juradoId }, data: { nome } });
  return json({ sessaoId: sessao.id });
});
