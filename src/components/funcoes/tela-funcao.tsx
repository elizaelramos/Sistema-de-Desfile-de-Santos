"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import { Aviso, Botao, Campo, Cartao } from "@/components/ui";
import { TelaCadastro } from "./tela-cadastro";
import { TelaFila } from "./tela-fila";
import { TelaLocutor } from "./tela-locutor";
import { TelaJurado } from "./tela-jurado";

type Funcao = "CADASTRO" | "FILA" | "LOCUTOR" | "JURADO";
type Sessao = { sessaoId: string; nome: string };

function lerSessao(token: string): Sessao | null {
  try {
    const bruto = localStorage.getItem(`desfile:${token}`);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function TelaFuncao({
  token,
  funcao,
  titulo,
  evento,
}: {
  token: string;
  funcao: Funcao;
  titulo: string;
  evento: string;
}) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);
  const { executar, ocupado, erro } = useAcao();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
    setSessao(lerSessao(token));
    setPronto(true);
  }, [token]);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nome = String(new FormData(e.currentTarget).get("nome")).trim();
    await executar(async () => {
      const { sessaoId } = await api<{ sessaoId: string }>(`/api/r/${token}/entrar`, { body: { nome } });
      const nova = { sessaoId, nome };
      try {
        localStorage.setItem(`desfile:${token}`, JSON.stringify(nova));
      } catch {}
      setSessao(nova);
    });
  }

  function sair() {
    try {
      localStorage.removeItem(`desfile:${token}`);
    } catch {}
    setSessao(null);
  }

  if (!pronto) return null;

  if (!sessao)
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-4">
        <div className="text-center">
          <p className="text-sm text-zinc-500">{evento}</p>
          <h1 className="text-3xl font-bold text-marca-900">{titulo}</h1>
        </div>
        <Cartao>
          <form onSubmit={entrar} className="flex flex-col gap-4">
            <Campo rotulo="Seu nome" name="nome" autoComplete="name" required autoFocus maxLength={60} />
            {erro && <Aviso>{erro}</Aviso>}
            <Botao grande disabled={ocupado}>
              Entrar
            </Botao>
          </form>
        </Cartao>
      </main>
    );

  const props = { token, sessao: sessao.sessaoId };
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-marca-900 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-sm">
          <span className="font-bold">{titulo}</span>
          <span className="flex-1 truncate text-marca-100">
            · {sessao.nome} · {evento}
          </span>
          <button onClick={sair} className="text-marca-100 hover:text-white">
            Trocar nome
          </button>
        </div>
      </header>
      {funcao === "CADASTRO" && <TelaCadastro {...props} />}
      {funcao === "FILA" && <TelaFila {...props} />}
      {funcao === "LOCUTOR" && <TelaLocutor {...props} />}
      {funcao === "JURADO" && <TelaJurado {...props} />}
    </div>
  );
}
