"use client";

import { useQuery } from "@tanstack/react-query";
import { api, POLL_INTERNO_MS } from "@/lib/cliente";
import { formatarHora } from "@/lib/datas";
import { Carregando, Cartao, Selo } from "@/components/ui";

type Dados = {
  quesitos: { id: string; nome: string }[];
  categorias: {
    id: string;
    nome: string;
    status: string;
    resultados: {
      posicao: number;
      media: number;
      criterioDesempate: string | null;
      sorteioEm: string | null;
      numero: number;
      nome: string;
      idade: number;
      santo: string;
      mediasQuesitos: (number | null)[];
    }[];
  }[];
};

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2).replace(".", ","));

export function AbaResultados({ eventoId }: { eventoId: string }) {
  const { data } = useQuery({
    queryKey: ["resultados", eventoId],
    queryFn: () => api<Dados>(`/api/org/eventos/${eventoId}/resultados`),
    refetchInterval: POLL_INTERNO_MS * 2,
  });

  if (!data) return <Carregando />;
  if (!data.categorias.length)
    return <p className="py-10 text-center text-zinc-500">Nenhuma categoria fechada ainda.</p>;

  return (
    <div className="flex flex-col gap-4">
      {data.categorias.map((c) => (
        <Cartao key={c.id}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold">{c.nome}</h2>
            <Selo status={c.status} />
          </div>
          {!c.resultados.length ? (
            <p className="text-sm text-zinc-500">Nenhum participante desfilou.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2">Pos.</th>
                    <th>Nº</th>
                    <th>Participante</th>
                    <th className="text-right">Média</th>
                    {data.quesitos.map((q) => (
                      <th key={q.id} className="text-right" title={q.nome}>
                        {q.nome}
                      </th>
                    ))}
                    <th className="pl-3">Desempate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {c.resultados.map((r) => (
                    <tr key={r.posicao} className={r.posicao <= 3 ? "font-semibold" : ""}>
                      <td className="py-2">{r.posicao <= 3 ? ["🥇", "🥈", "🥉"][r.posicao - 1] : `${r.posicao}º`}</td>
                      <td>{r.numero}</td>
                      <td>
                        {r.nome}
                        <span className="block text-xs font-normal text-zinc-500">
                          {r.santo} · {r.idade} anos
                        </span>
                      </td>
                      <td className="text-right">{fmt(r.media)}</td>
                      {r.mediasQuesitos.map((m, i) => (
                        <td key={i} className="text-right font-normal">
                          {fmt(m)}
                        </td>
                      ))}
                      <td className="pl-3 text-xs font-normal text-zinc-600">
                        {r.criterioDesempate && `à frente por ${r.criterioDesempate}`}
                        {r.sorteioEm && (
                          <span className="block text-amber-700">Sorteio em {formatarHora(r.sorteioEm)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>
      ))}
    </div>
  );
}
