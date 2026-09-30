import { db } from "./db";
import { ErroApp } from "./api";
import type { Funcao } from "@/generated/prisma/client";

export const NOME_FUNCAO: Record<Funcao, string> = {
  CADASTRO: "Cadastro",
  FILA: "Fila",
  LOCUTOR: "Locutor",
  JURADO: "Jurado",
};

/** Considera conectado quem fez uma requisição nos últimos 30 s. */
export const JANELA_CONEXAO_MS = 30_000;

/**
 * Valida o token do QR Code. Tokens de eventos encerrados ou regenerados
 * deixam de funcionar.
 */
export async function validarAcesso(token: string, funcoes?: Funcao[]) {
  const acesso = await db.acesso.findUnique({
    where: { token },
    include: { evento: true, jurado: true },
  });
  if (!acesso || !acesso.ativo) throw new ErroApp("QR Code inválido ou substituído", 403);
  if (acesso.evento.status === "ENCERRADO") throw new ErroApp("Este evento foi encerrado", 403);
  if (funcoes && !funcoes.includes(acesso.funcao))
    throw new ErroApp("Função sem permissão para esta ação", 403);
  return acesso;
}

/** Atualiza o "visto por último" da sessão enviada pelo aparelho. */
export async function registrarPresenca(acessoId: string, request: Request) {
  const sessaoId = request.headers.get("x-sessao");
  if (!sessaoId) return;
  await db.sessao.updateMany({
    where: { id: sessaoId, acessoId },
    data: { ultimoAcesso: new Date() },
  });
}
