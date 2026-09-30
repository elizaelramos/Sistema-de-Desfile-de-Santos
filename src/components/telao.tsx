"use client";

import { useQuery } from "@tanstack/react-query";
import { api, POLL_PUBLICO_MS } from "@/lib/cliente";
import type { PainelPublico } from "@/lib/paineis";
import { Podio } from "./podio";

export function Telao({ slug }: { slug: string }) {
  const { data, error } = useQuery({
    queryKey: ["publico", slug],
    queryFn: () => api<PainelPublico>(`/api/publico/${slug}`),
    refetchInterval: POLL_PUBLICO_MS,
  });

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-gradient-to-b from-marca-900 to-black p-4 text-white sm:p-8">
      <header className="text-center">
        <h1 className="text-xl font-bold text-marca-100 sm:text-3xl">{data?.evento.nome ?? "Desfile de Santos"}</h1>
        {data?.categoria && !data.podio && (
          <p className="mt-1 text-lg font-semibold uppercase tracking-widest text-ouro sm:text-2xl">
            Categoria {data.categoria}
          </p>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-6">
        {!data && !error && <p className="text-center text-xl opacity-70">Carregando…</p>}
        {error && !data && <p className="text-center text-xl opacity-70">{(error as Error).message}</p>}

        {data?.podio ? (
          <Podio podio={data.podio} telao />
        ) : data?.atual ? (
          <section className="text-center">
            <p className="text-lg uppercase tracking-widest opacity-70 sm:text-2xl">Desfilando agora</p>
            <p className="mt-2 text-7xl font-black text-ouro sm:text-9xl">nº {data.atual.numero}</p>
            <p className="mt-4 text-4xl font-bold sm:text-6xl">{data.atual.nome}</p>
            <p className="mt-4 text-3xl opacity-90 sm:text-5xl">{data.atual.santo}</p>
          </section>
        ) : (
          data && (
            <p className="text-center text-2xl opacity-80 sm:text-4xl">
              {data.evento.encerrado
                ? "Obrigado pela participação!"
                : data.categoria
                  ? "O desfile já vai começar…"
                  : "Aguardando o início da próxima categoria"}
            </p>
          )
        )}
      </div>
    </main>
  );
}
