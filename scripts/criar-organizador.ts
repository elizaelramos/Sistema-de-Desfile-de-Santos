/**
 * Cria (ou atualiza a senha de) um organizador. Use --super para criar um super admin, que depois
 * cadastra os coordenadores pela tela /painel/usuarios.
 * Uso: npm run organizador -- "Nome" email@exemplo.com senha [--super]
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const args = process.argv.slice(2);
  const papel = args.includes("--super") ? "SUPER_ADMIN" : "ORGANIZADOR";
  const [nome, email, senha] = args.filter((a) => a !== "--super");
  if (!nome || !email || !senha) {
    console.error('Uso: npm run organizador -- "Nome" email@exemplo.com senha [--super]');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }
  const senhaHash = await bcrypt.hash(senha, 12);
  const org = await db.organizador.upsert({
    where: { email: email.toLowerCase() },
    create: { nome, email: email.toLowerCase(), senhaHash, papel },
    update: { nome, senhaHash, ativo: true, ...(papel === "SUPER_ADMIN" && { papel }) },
  });
  console.log(`${org.papel === "SUPER_ADMIN" ? "Super admin" : "Organizador"} pronto: ${org.nome} <${org.email}>`);
}

main().finally(() => db.$disconnect());
