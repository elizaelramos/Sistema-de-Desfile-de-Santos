"use client";

import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import type { PainelLocutor } from "@/lib/paineis";
import { Aviso, Botao, Carregando } from "@/components/ui";
import { MEDALHAS } from "@/components/podio";
import { useEstado, type PropsFuncao } from "./use-estado";

type AcaoPremiacao =
  | { acao: "iniciar"; categoriaId: string }
  | { acao: "revelar"; categoriaId: string; posicao: number }
  | { acao: "encerrar" };

export function TelaLocutor(props: PropsFuncao) {
  const { token } = props;
  const queryClient = useQueryClient();
  const { data, error } = useEstado<PainelLocutor>(props);
  const { executar, ocupado, erro } = useAcao();

  async function premiacao(body: AcaoPremiacao) {
    await executar(() => api(`/api/r/${token}/premiacao`, { body }));
    queryClient.invalidateQueries({ queryKey: ["estado", token] });
  }

  if (error) return <main className="p-4"><Aviso>{(error as Error).message}</Aviso></main>;
  if (!data) return <Carregando />;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      {erro && <Aviso>{erro}</Aviso>}

      {data.premiacoes.map((p) => (
        <section
          key={p.categoriaId}
          className={`rounded-3xl border-2 p-5 ${p.noTelao ? "border-ouro bg-amber-50" : "border-zinc-200 bg-white"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-700">Resultado — só você está vendo</p>
              <p className="text-2xl font-bold">{p.categoria}</p>
            </div>
            {p.noTelao ? (
              <Botao variante="secundario" disabled={ocupado} onClick={() => premiacao({ acao: "encerrar" })}>
                Encerrar premiação
              </Botao>
            ) : (
              <Botao
                variante="sucesso"
                grande
                disabled={ocupado}
                onClick={() => premiacao({ acao: "iniciar", categoriaId: p.categoriaId })}
              >
                Iniciar premiação da categoria
              </Botao>
            )}
          </div>
          {p.noTelao && (
            <p className="mt-2 text-sm text-amber-800">
              No telão: tela de premiação com os nomes ocultos. Revele cada posição quando quiser.
            </p>
          )}

          <ol className="mt-4 flex flex-col gap-3">
            {p.itens.map((i) => (
              <li key={i.posicao} className="flex items-center gap-3">
                <span className="text-4xl">{MEDALHAS[i.posicao - 1]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold leading-tight">
                    nº {i.numero} — {i.nome}
                  </p>
                  <p className="text-zinc-600">
                    {i.idade} anos · {i.santo}
                  </p>
                </div>
                {i.revelado ? (
                  <span className="whitespace-nowrap text-sm font-semibold text-emerald-700">✓ No telão</span>
                ) : (
                  <Botao
                    disabled={!p.noTelao || ocupado}
                    onClick={() => premiacao({ acao: "revelar", categoriaId: p.categoriaId, posicao: i.posicao })}
                  >
                    Revelar
                  </Botao>
                )}
              </li>
            ))}
            {!p.itens.length && <li className="text-center text-zinc-500">Nenhum participante desfilou.</li>}
          </ol>
        </section>
      ))}

      <p className="text-center text-sm font-semibold uppercase tracking-wide text-marca-700">
        {data.categoria ? `Categoria ${data.categoria}` : "Nenhuma categoria em andamento"}
      </p>

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
