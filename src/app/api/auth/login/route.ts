import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ErroApp, json, rota } from "@/lib/api";
import { criarSessaoOrganizador } from "@/lib/auth";
import { esquemaLogin } from "@/lib/validacao";

export const POST = rota(async (request: Request) => {
  const { email, senha } = esquemaLogin.parse(await request.json());
  const org = await db.organizador.findUnique({ where: { email } });
  if (!org || !(await bcrypt.compare(senha, org.senhaHash)))
    throw new ErroApp("E-mail ou senha incorretos", 401);
  if (!org.ativo) throw new ErroApp("Este acesso foi desativado. Fale com o super admin.", 403);
  await criarSessaoOrganizador(org.id);
  return json({ ok: true });
});
