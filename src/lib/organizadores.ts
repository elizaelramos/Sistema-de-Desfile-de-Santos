import bcrypt from "bcryptjs";
import { db } from "./db";
import { ErroApp } from "./api";
import type { Papel } from "@/generated/prisma/client";

const CAMPOS = { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true } as const;

export async function listarOrganizadores() {
  const lista = await db.organizador.findMany({
    orderBy: [{ papel: "asc" }, { nome: "asc" }],
    select: { ...CAMPOS, _count: { select: { eventos: true } } },
  });
  return lista.map(({ _count, ...o }) => ({ ...o, eventos: _count.eventos }));
}

export async function criarOrganizador(dados: { nome: string; email: string; senha: string; papel: Papel }) {
  if (await db.organizador.findUnique({ where: { email: dados.email } }))
    throw new ErroApp("Já existe um usuário com este e-mail");
  const { senha, ...resto } = dados;
  return db.organizador.create({
    data: { ...resto, senhaHash: await bcrypt.hash(senha, 12) },
    select: CAMPOS,
  });
}

export async function editarOrganizador(
  quemEdita: string,
  id: string,
  dados: { nome?: string; papel?: Papel; ativo?: boolean; senha?: string },
) {
  const alvo = await db.organizador.findUnique({ where: { id } });
  if (!alvo) throw new ErroApp("Usuário não encontrado", 404);
  // Impede que o super admin tire o próprio acesso à gestão.
  if (id === quemEdita && (dados.ativo === false || dados.papel === "ORGANIZADOR"))
    throw new ErroApp("Você não pode desativar nem rebaixar a si mesmo");

  const { senha, ...campos } = dados;
  await db.$transaction(async (tx) => {
    await tx.organizador.update({
      where: { id },
      data: { ...campos, ...(senha && { senhaHash: await bcrypt.hash(senha, 12) }) },
    });
    // Desativar ou trocar a senha derruba as sessões abertas.
    if (dados.ativo === false || (senha && id !== quemEdita))
      await tx.sessaoOrganizador.deleteMany({ where: { organizadorId: id } });
  });
}
