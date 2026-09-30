"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import type { PainelJurado } from "@/lib/paineis";
import { Aviso, Botao, Carregando, Cartao } from "@/components/ui";
import { useEstado, type PropsFuncao } from "./use-estado";

type Dados = PainelJurado & { jurado: { numero: number } };
type Valores = Record<string, number>;

export function TelaJurado(props: PropsFuncao) {
  const { token } = props;
  const queryClient = useQueryClient();
  const { data, error } = useEstado<Dados>(props);
  const { executar, ocupado, erro, setErro } = useAcao();

  // Participante escolhido para corrigir notas já confirmadas.
  const [edicaoId, setEdicaoId] = useState<string | null>(null);
  // Rascunho das notas, sempre vinculado a um participante.
  const [rascunho, setRascunho] = useState<{ pid: string; valores: Valores } | null>(null);
  const [resumoPid, setResumoPid] = useState<string | null>(null);

  if (error) return <main className="p-4"><Aviso>{(error as Error).message}</Aviso></main>;
  if (!data) return <Carregando />;

  const { atual, quesitos, avaliados } = data;
  const emEdicao = edicaoId ? avaliados.find((a) => a.id === edicaoId) : undefined;
  const alvo = emEdicao ?? (atual && !atual.confirmado ? atual : undefined);
  const valores: Valores = alvo ? (rascunho?.pid === alvo.id ? rascunho.valores : alvo.notas) : {};
  const completo = quesitos.every((q) => valores[q.id]);
  const noResumo = alvo && resumoPid === alvo.id;

  function darNota(quesitoId: string, valor: number) {
    if (!alvo) return;
    setRascunho({ pid: alvo.id, valores: { ...valores, [quesitoId]: valor } });
  }

  function cancelarEdicao() {
    setEdicaoId(null);
    setResumoPid(null);
    setErro("");
  }

  async function confirmar() {
    if (!alvo) return;
    const ok = await executar(() =>
      api(`/api/r/${token}/notas`, {
        body: {
          participanteId: alvo.id,
          notas: quesitos.map((q) => ({ quesitoId: q.id, valor: valores[q.id] })),
        },
      }),
    );
    if (ok) {
      setEdicaoId(null);
      setResumoPid(null);
      setRascunho(null);
    }
    await queryClient.invalidateQueries({ queryKey: ["estado", token] });
  }

  if (!data.categoria)
    return <Espera titulo="Nenhuma categoria em andamento" texto="Aguarde o organizador abrir a próxima categoria." />;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      {alvo ? (
        <>
          <section className="rounded-3xl bg-marca-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase text-marca-100">
              {emEdicao ? "Corrigindo notas" : `Avaliando · ${data.categoria}`}
            </p>
            <p className="text-4xl font-black text-ouro">nº {alvo.numero}</p>
            <p className="text-2xl font-bold">{alvo.nome}</p>
            <p className="text-lg text-marca-100">{alvo.santo}</p>
          </section>

          {erro && <Aviso>{erro}</Aviso>}

          {noResumo ? (
            <Cartao>
              <h2 className="mb-3 text-lg font-bold">Confira suas notas</h2>
              <ul className="mb-4 divide-y divide-zinc-100">
                {quesitos.map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2">
                    <span>{q.nome}</span>
                    <span className="text-2xl font-bold text-marca-700">{valores[q.id]}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Botao grande variante="secundario" onClick={() => setResumoPid(null)}>
                  Trocar nota
                </Botao>
                <Botao grande variante="sucesso" disabled={ocupado} onClick={confirmar}>
                  Confirmar
                </Botao>
              </div>
            </Cartao>
          ) : (
            <>
              {quesitos.map((q, i) => (
                <Cartao key={q.id}>
                  <p className="mb-2 font-semibold">
                    {i + 1}. {q.nome}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => darNota(q.id, n)}
                        className={`min-h-14 rounded-xl text-xl font-bold transition active:scale-95 ${
                          valores[q.id] === n
                            ? "bg-marca-700 text-white shadow-lg"
                            : "border border-zinc-300 bg-white text-zinc-800"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Cartao>
              ))}
              <Botao grande disabled={!completo} onClick={() => setResumoPid(alvo.id)}>
                {completo ? "Enviar" : "Dê nota em todos os quesitos"}
              </Botao>
              {emEdicao && (
                <Botao variante="secundario" onClick={cancelarEdicao}>
                  Cancelar correção
                </Botao>
              )}
            </>
          )}
        </>
      ) : (
        <Espera
          titulo={atual ? "Notas confirmadas ✓" : "Aguardando o primeiro participante"}
          texto={atual ? "Aguardando próximo participante…" : `Categoria ${data.categoria}`}
        />
      )}

      {!alvo && avaliados.length > 0 && (
        <Cartao>
          <h2 className="mb-1 font-semibold">Suas avaliações nesta categoria</h2>
          <p className="mb-2 text-xs text-zinc-500">Dá para corrigir até o organizador fechar a categoria.</p>
          <ul className="divide-y divide-zinc-100">
            {avaliados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-12 font-bold text-marca-700">{p.numero}</span>
                <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                <span className="text-sm text-zinc-500">{quesitos.map((q) => p.notas[q.id] ?? "–").join(" · ")}</span>
                <Botao variante="fantasma" onClick={() => setEdicaoId(p.id)}>
                  Trocar
                </Botao>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </main>
  );
}

function Espera({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-2xl font-bold">{titulo}</p>
      <p className="text-zinc-500">{texto}</p>
    </section>
  );
}
