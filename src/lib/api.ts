import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Erro de regra de negócio, devolvido ao cliente com a mensagem. */
export class ErroApp extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function json<T>(dados: T, init?: ResponseInit) {
  return NextResponse.json(dados, init);
}

/** Envolve um handler e converte erros conhecidos em respostas JSON. */
export function rota<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ErroApp) return json({ erro: e.message }, { status: e.status });
      if (e instanceof ZodError)
        return json({ erro: e.issues.map((i) => i.message).join("; ") }, { status: 400 });
      console.error(e);
      return json({ erro: "Erro interno" }, { status: 500 });
    }
  };
}
