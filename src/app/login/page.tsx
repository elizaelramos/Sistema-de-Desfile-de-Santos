"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { Aviso, Botao, Campo, Cartao } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setErro("");
    setEnviando(true);
    try {
      await api("/api/auth/login", { body: { email: form.get("email"), senha: form.get("senha") } });
      router.replace("/painel");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-marca-900">Desfile de Santos</h1>
        <p className="text-sm text-zinc-500">Acesso do organizador</p>
      </div>
      <Cartao>
        <form onSubmit={entrar} className="flex flex-col gap-4">
          <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" required />
          <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
          {erro && <Aviso>{erro}</Aviso>}
          <Botao grande disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</Botao>
        </form>
      </Cartao>
      <p className="text-center text-xs text-zinc-500">
        Cadastro, fila, locutor e jurados entram pelo QR Code da função.
      </p>
    </main>
  );
}
