"use client";

import { useState } from "react";
import { api } from "@/lib/cliente";
import { formatarHora } from "@/lib/datas";
import { useAcao } from "@/lib/use-acao";
import { Aviso, Botao, Cartao, Selo } from "@/components/ui";
import type { DadosPainel } from "./tipos";

type Props = { dados: DadosPainel; atualizar: () => unknown };

export function AbaAndamento({ dados, atualizar }: Props) {
  const { evento, categorias, aoVivo, quesitos, ocorrencias } = dados;
  const { executar, ocupado, erro } = useAcao();
  const [forcar, setForcar] = useState<null | { tipo: "fechar"; categoriaId: string } | { tipo: "liberar" }>(null);
  const [motivo, setMotivo] = useState("");
  const encerrado = evento.status === "ENCERRADO";
  const algumaEmAndamento = categorias.some((c) => c.status === "EM_ANDAMENTO");

  async function acaoCategoria(categoriaId: string, acao: "abrir" | "fechar" | "revelar", motivoForcado?: string) {
    if (acao === "abrir" && !quesitos.length) {
      alert("Cadastre os quesitos na aba Configuração antes de abrir uma categoria.");
      return;
    }
    if (acao === "fechar" && !motivoForcado && !confirm("Fechar a categoria? As notas ficarão travadas e o ranking será calculado."))
      return;
    const ok = await executar(() =>
      api(`/api/org/eventos/${evento.id}/categorias/${categoriaId}`, {
        body: { acao, motivo: motivoForcado },
      }),
    );
    if (ok) {
      setForcar(null);
      setMotivo("");
    }
    atualizar();
  }

  async function liberarManual() {
    if (!aoVivo.proximo) return;
    const ok = await executar(() =>
      api(`/api/org/eventos/${evento.id}/liberar`, {
        body: { participanteId: aoVivo.proximo!.id, motivo },
      }),
    );
    if (ok) {
      setForcar(null);
      setMotivo("");
    }
    atualizar();
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}

      <Cartao className="bg-marca-50">
        <h2 className="mb-2 text-sm font-semibold uppercase text-marca-700">Agora</h2>
        {!aoVivo.categoriaAtual ? (
          <p className="text-zinc-600">Nenhuma categoria em andamento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold">{aoVivo.categoriaAtual.nome}</p>
            {aoVivo.participanteAtual ? (
              <p>
                Desfilando: <b>nº {aoVivo.participanteAtual.numero}</b> — {aoVivo.participanteAtual.nome} (
                {aoVivo.participanteAtual.santo})
              </p>
            ) : (
              <p className="text-zinc-600">A fila ainda não liberou o primeiro participante.</p>
            )}
            {aoVivo.proximo && (
              <p className="text-sm text-zinc-600">
                Próximo: nº {aoVivo.proximo.numero} — {aoVivo.proximo.nome}
              </p>
            )}
            {aoVivo.pendentes.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Aviso tipo="info">
                  Aguardando notas de{" "}
                  {aoVivo.pendentes.map((j) => `Jurado ${j.numero}${j.nome ? ` (${j.nome})` : ""}`).join(", ")}
                </Aviso>
                {aoVivo.proximo && forcar?.tipo !== "liberar" && (
                  <Botao variante="secundario" onClick={() => setForcar({ tipo: "liberar" })}>
                    Jurado impedido? Liberar próximo manualmente
                  </Botao>
                )}
              </div>
            ) : (
              aoVivo.participanteAtual && <Aviso tipo="sucesso">Todos os jurados confirmaram.</Aviso>
            )}
          </div>
        )}
      </Cartao>

      {forcar && (
        <Cartao className="border-amber-300">
          <h3 className="mb-2 font-semibold">
            {forcar.tipo === "liberar"
              ? `Liberar nº ${aoVivo.proximo?.numero} sem todas as notas`
              : "Fechar categoria sem todas as notas"}
          </h3>
          <p className="mb-2 text-sm text-zinc-600">
            O participante atual ficará sem as notas dos jurados pendentes; a média usa só as notas existentes. O
            motivo fica registrado nas ocorrências.
          </p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (ex.: Jurado 2 passou mal)"
            className="mb-2 w-full rounded-xl border border-zinc-300 p-3"
            rows={2}
          />
          <div className="flex gap-2">
            <Botao
              variante="perigo"
              disabled={!motivo.trim() || ocupado}
              onClick={() =>
                forcar.tipo === "liberar" ? liberarManual() : acaoCategoria(forcar.categoriaId, "fechar", motivo)
              }
            >
              Confirmar
            </Botao>
            <Botao variante="secundario" onClick={() => setForcar(null)}>
              Cancelar
            </Botao>
          </div>
        </Cartao>
      )}

      <Cartao>
        <h2 className="mb-3 font-semibold">Categorias</h2>
        <ul className="divide-y divide-zinc-100">
          {categorias.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-40 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.nome}</span>
                  <Selo status={c.status} />
                </div>
                <p className="text-xs text-zinc-500">
                  {c.idadeMin}–{c.idadeMax} anos · {c.total} inscritos · {c.desfilaram} desfilaram
                  {c.ausentes > 0 && ` · ${c.ausentes} ausentes`}
                </p>
              </div>
              {!encerrado && c.status === "AGUARDANDO" && (
                <Botao disabled={ocupado || algumaEmAndamento} onClick={() => acaoCategoria(c.id, "abrir")}>
                  Abrir
                </Botao>
              )}
              {!encerrado && c.status === "EM_ANDAMENTO" && (
                <Botao
                  variante="perigo"
                  disabled={ocupado}
                  onClick={() =>
                    aoVivo.pendentes.length ? setForcar({ tipo: "fechar", categoriaId: c.id }) : acaoCategoria(c.id, "fechar")
                  }
                >
                  Fechar categoria
                </Botao>
              )}
              {!encerrado && (c.status === "FECHADA" || c.status === "REVELADA") && (
                <Botao
                  variante={c.status === "FECHADA" ? "sucesso" : "secundario"}
                  disabled={ocupado}
                  onClick={() => acaoCategoria(c.id, "revelar")}
                >
                  {c.status === "FECHADA" ? "Revelar resultado" : "Mostrar pódio de novo"}
                </Botao>
              )}
            </li>
          ))}
        </ul>
      </Cartao>

      {ocorrencias.length > 0 && (
        <Cartao>
          <h2 className="mb-2 font-semibold">Ocorrências</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {ocorrencias.map((o) => (
              <li key={o.id}>
                <span className="text-zinc-500">{formatarHora(o.criadoEm)}</span> — {o.descricao}
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
