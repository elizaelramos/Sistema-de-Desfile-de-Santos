"use client";

import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import type { PainelFila } from "@/lib/paineis";
import { Aviso, Botao, Carregando, Cartao, Selo } from "@/components/ui";
import { useEstado, type PropsFuncao } from "./use-estado";

export function TelaFila(props: PropsFuncao) {
  const { token } = props;
  const queryClient = useQueryClient();
  const { data, error } = useEstado<PainelFila>(props);
  const { executar, ocupado, erro } = useAcao();

  async function acao(acao: "presente" | "ausente" | "liberar", participanteId: string) {
    await executar(() => api(`/api/r/${token}/fila`, { body: { acao, participanteId } }));
    queryClient.invalidateQueries({ queryKey: ["estado", token] });
  }

  if (error) return <main className="p-4"><Aviso>{(error as Error).message}</Aviso></main>;
  if (!data) return <Carregando />;
  if (!data.categoria)
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center text-zinc-500">
        <p className="text-lg">Nenhuma categoria em andamento.</p>
        <p className="text-sm">Aguarde o organizador abrir a próxima categoria.</p>
      </main>
    );

  const travado = data.pendentes.length > 0;
  const naFila = data.fila.filter((p) => p.status !== "DESFILOU");
  const desfilaram = data.fila.filter((p) => p.status === "DESFILOU");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{data.categoria.nome}</h2>
        <span className="text-sm text-zinc-500">
          {desfilaram.length} de {data.fila.length} desfilaram
        </span>
      </div>

      {data.atual && (
        <Cartao className="bg-marca-50">
          <p className="text-xs font-semibold uppercase text-marca-700">Desfilando agora</p>
          <p className="text-lg">
            <b>nº {data.atual.numero}</b> — {data.atual.nome}
          </p>
        </Cartao>
      )}

      {travado ? (
        <Aviso tipo="info">
          ⏳ Aguardando {data.pendentes.map((j) => `Jurado ${j.numero}`).join(", ")} — o próximo só pode ser liberado
          depois que todos os jurados confirmarem.
        </Aviso>
      ) : (
        data.atual && <Aviso tipo="sucesso">✓ Todos os jurados confirmaram. Pode liberar o próximo.</Aviso>
      )}
      {erro && <Aviso>{erro}</Aviso>}

      <ul className="flex flex-col gap-2">
        {naFila.map((p, i) => (
          <li key={p.id}>
            <Cartao className={i === 0 ? "border-2 border-marca-500" : ""}>
              <div className="flex items-start gap-3">
                <span className="w-14 text-3xl font-bold text-marca-700">{p.numero}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-sm text-zinc-500">
                    {p.santo} · {p.idade} anos
                  </p>
                </div>
                <Selo status={p.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Botao
                  variante={p.status === "PRESENTE" ? "sucesso" : "secundario"}
                  disabled={ocupado}
                  onClick={() => acao("presente", p.id)}
                >
                  Presente
                </Botao>
                <Botao variante="secundario" disabled={ocupado} onClick={() => acao("ausente", p.id)}>
                  Ausente
                </Botao>
                <Botao disabled={ocupado || travado} onClick={() => acao("liberar", p.id)}>
                  Liberar
                </Botao>
              </div>
            </Cartao>
          </li>
        ))}
        {!naFila.length && (
          <p className="py-6 text-center text-zinc-500">
            Todos desfilaram. O organizador pode fechar a categoria.
          </p>
        )}
      </ul>

      {desfilaram.length > 0 && (
        <details className="rounded-2xl bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Já desfilaram ({desfilaram.length})</summary>
          <ul className="mt-2 divide-y divide-zinc-100">
            {desfilaram.map((p) => (
              <li key={p.id} className="py-1">
                nº {p.numero} — {p.nome}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
