import { cookies } from "next/headers";
import { db } from "./db";
import { ErroApp } from "./api";
import { gerarToken } from "./tokens";

const COOKIE = "desfile_org";
const DURACAO_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

export async function criarSessaoOrganizador(organizadorId: string) {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + DURACAO_MS);
  await db.sessaoOrganizador.create({ data: { token, organizadorId, expiraEm } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessaoOrganizador() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.sessaoOrganizador.deleteMany({ where: { token } });
  jar.delete(COOKIE);
}

export async function organizadorAtual() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const sessao = await db.sessaoOrganizador.findUnique({
    where: { token },
    include: { organizador: { select: { id: true, nome: true, email: true } } },
  });
  if (!sessao || sessao.expiraEm < new Date()) return null;
  return sessao.organizador;
}

export async function exigirOrganizador() {
  const org = await organizadorAtual();
  if (!org) throw new ErroApp("Não autenticado", 401);
  return org;
}

/** Garante que o evento pertence ao organizador logado. */
export async function exigirEventoDoOrganizador(eventoId: string) {
  const org = await exigirOrganizador();
  const evento = await db.evento.findFirst({ where: { id: eventoId, organizadorId: org.id } });
  if (!evento) throw new ErroApp("Evento não encontrado", 404);
  return evento;
}
