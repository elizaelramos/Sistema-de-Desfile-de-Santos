"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, POLL_INTERNO_MS } from "@/lib/cliente";
import { formatarData } from "@/lib/datas";
import { Aviso, Carregando } from "@/components/ui";
import { Cabecalho } from "./cabecalho";
import { AbaAndamento } from "./aba-andamento";
import { AbaConfig } from "./aba-config";
import { AbaAcessos } from "./aba-acessos";
import { AbaResultados } from "./aba-resultados";
import type { DadosPainel } from "./tipos";

export type Aba = "andamento" | "config" | "acessos" | "resultados";

const ROTULOS: Record<Aba, string> = {
  andamento: "Andamento",
  config: "Configuração",
  acessos: "QR Codes",
  resultados: "Resultados",
};

export function PainelEvento({ eventoId, abaInicial }: { eventoId: string; abaInicial: Aba }) {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const { data, error, refetch } = useQuery({
    queryKey: ["painel", eventoId],
    queryFn: () => api<DadosPainel>(`/api/org/eventos/${eventoId}`),
    refetchInterval: POLL_INTERNO_MS,
  });

  function trocarAba(nova: Aba) {
    setAba(nova);
    window.history.replaceState(null, "", `?aba=${nova}`);
  }

  return (
    <>
      <Cabecalho titulo={data?.evento.nome ?? "Evento"} voltar="/painel" />
      <nav className="sticky top-12 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl overflow-x-auto px-2">
          {(Object.keys(ROTULOS) as Aba[]).map((a) => (
            <button
              key={a}
              onClick={() => trocarAba(a)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
                aba === a
                  ? "border-marca-700 text-marca-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {ROTULOS[a]}
            </button>
          ))}
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        {error && <Aviso>{(error as Error).message}</Aviso>}
        {!data ? (
          <Carregando />
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              {formatarData(data.evento.data)}
              {data.evento.local && ` · ${data.evento.local}`}
              {data.evento.status === "ENCERRADO" && " · Evento encerrado (QR Codes desativados)"}
            </p>
            {aba === "andamento" && <AbaAndamento dados={data} atualizar={refetch} />}
            {aba === "config" && <AbaConfig dados={data} atualizar={refetch} />}
            {aba === "acessos" && <AbaAcessos eventoId={eventoId} />}
            {aba === "resultados" && <AbaResultados eventoId={eventoId} />}
          </>
        )}
      </main>
    </>
  );
}
