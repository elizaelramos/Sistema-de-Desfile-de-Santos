"use client";

import { useState } from "react";
import { Aviso, Botao, Campo } from "@/components/ui";

export type DadosFormEvento = { nome: string; data: string; local: string };

export function FormNovoEvento({
  inicial,
  textoBotao,
  aoEnviar,
}: {
  inicial?: Partial<DadosFormEvento>;
  textoBotao: string;
  aoEnviar: (dados: DadosFormEvento) => Promise<void>;
}) {
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErro("");
    setEnviando(true);
    try {
      await aoEnviar({
        nome: String(f.get("nome")),
        data: String(f.get("data")),
        local: String(f.get("local")),
      });
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <Campo rotulo="Nome do evento" name="nome" defaultValue={inicial?.nome} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Data" name="data" type="date" defaultValue={inicial?.data} required />
        <Campo rotulo="Local" name="local" defaultValue={inicial?.local} />
      </div>
      {erro && <Aviso>{erro}</Aviso>}
      <Botao disabled={enviando}>{enviando ? "Salvando…" : textoBotao}</Botao>
    </form>
  );
}
