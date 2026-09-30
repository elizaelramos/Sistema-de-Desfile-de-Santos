/**
 * Cria (ou atualiza a senha de) um organizador. No MVP, organizadores são criados manualmente.
 * Uso: npm run organizador -- "Nome" email@exemplo.com senha
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const [nome, email, senha] = process.argv.slice(2);
  if (!nome || !email || !senha) {
    console.error('Uso: npm run organizador -- "Nome" email@exemplo.com senha');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }
  const senhaHash = await bcrypt.hash(senha, 12);
  const org = await db.organizador.upsert({
    where: { email: email.toLowerCase() },
    create: { nome, email: email.toLowerCase(), senhaHash },
    update: { nome, senhaHash },
  });
  console.log(`Organizador pronto: ${org.nome} <${org.email}>`);
}

main().finally(() => db.$disconnect());
