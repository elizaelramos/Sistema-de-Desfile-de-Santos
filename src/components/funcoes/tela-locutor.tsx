"use client";

import type { PainelLocutor } from "@/lib/paineis";
import { Aviso, Carregando } from "@/components/ui";
import { Podio } from "@/components/podio";
import { useEstado, type PropsFuncao } from "./use-estado";

export function TelaLocutor(props: PropsFuncao) {
  const { data, error } = useEstado<PainelLocutor>(props);

  if (error) return <main className="p-4"><Aviso>{(error as Error).message}</Aviso></main>;
  if (!data) return <Carregando />;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-marca-700">
        {data.categoria ? `Categoria ${data.categoria}` : "Nenhuma categoria em andamento"}
      </p>

      {data.podio && <Podio podio={data.podio} />}

      <section className="rounded-3xl bg-marca-900 p-6 text-white">
        <p className="text-sm font-semibold uppercase text-marca-100">Agora</p>
        {data.atual ? (
          <>
            <p className="text-6xl font-black text-ouro">nº {data.atual.numero}</p>
            <p className="mt-2 text-4xl font-bold leading-tight">{data.atual.nome}</p>
            <p className="mt-1 text-2xl">{data.atual.idade} anos</p>
            <p className="mt-3 text-3xl font-semibold">{data.atual.santo}</p>
          </>
        ) : (
          <p className="mt-2 text-2xl text-marca-100">Aguardando a fila liberar…</p>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold uppercase text-zinc-500">Próximo</p>
        {data.proximo ? (
          <>
            <p className="text-2xl font-bold">
              nº {data.proximo.numero} — {data.proximo.nome}
            </p>
            <p className="text-lg text-zinc-600">
              {data.proximo.idade} anos · {data.proximo.santo}
            </p>
          </>
        ) : (
          <p className="text-lg text-zinc-500">—</p>
        )}
      </section>
    </main>
  );
}
