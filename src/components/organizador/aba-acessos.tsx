"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import { Aviso, Botao, Carregando, Cartao } from "@/components/ui";

type Acesso = {
  id: string;
  funcao: string;
  titulo: string;
  url: string;
  qr: string;
  sessoes: { id: string; nome: string; ultimoAcesso: string; conectado: boolean }[];
};

type Dados = { publico: { url: string; qr: string }; acessos: Acesso[] };

function copiar(texto: string) {
  navigator.clipboard?.writeText(texto);
}

export function AbaAcessos({ eventoId }: { eventoId: string }) {
  const { data, refetch } = useQuery({
    queryKey: ["acessos", eventoId],
    queryFn: () => api<Dados>(`/api/org/eventos/${eventoId}/acessos`),
    refetchInterval: 5000,
  });
  const { executar, ocupado, erro } = useAcao();

  async function regenerar(a: Acesso) {
    if (!confirm(`Gerar um novo QR Code para ${a.titulo}? O QR atual deixa de funcionar e os aparelhos conectados são desconectados.`))
      return;
    await executar(() => api(`/api/org/eventos/${eventoId}/acessos`, { body: { acessoId: a.id } }));
    refetch();
  }

  if (!data) return <Carregando />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-zinc-600">
          Cada função tem seu QR Code; cada jurado tem o seu, individual. Quem trocar de aparelho escaneia o mesmo QR.
        </p>
        <Botao variante="secundario" onClick={() => window.print()}>
          Imprimir
        </Botao>
      </div>
      {erro && <Aviso>{erro}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao className="flex flex-col items-center gap-2 break-inside-avoid text-center">
          <h3 className="text-lg font-bold">Telão / Público</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.publico.qr} alt="QR Code da página pública" className="w-48" />
          <a href={data.publico.url} target="_blank" className="break-all text-xs text-marca-700 underline">
            {data.publico.url}
          </a>
          <Botao variante="fantasma" className="print:hidden" onClick={() => copiar(data.publico.url)}>
            Copiar link
          </Botao>
        </Cartao>

        {data.acessos.map((a) => {
          const conectados = a.sessoes.filter((s) => s.conectado);
          return (
            <Cartao key={a.id} className="flex flex-col items-center gap-2 break-inside-avoid text-center">
              <h3 className="text-lg font-bold">{a.titulo}</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.qr} alt={`QR Code de ${a.titulo}`} className="w-48" />
              <div className="w-full text-sm print:hidden">
                {conectados.length ? (
                  <p className="text-emerald-700">
                    ● {conectados.map((s) => s.nome).join(", ")}
                  </p>
                ) : (
                  <p className="text-zinc-400">○ Ninguém conectado</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-1 print:hidden">
                <a href={a.url} target="_blank">
                  <Botao variante="fantasma">Abrir</Botao>
                </a>
                <Botao variante="fantasma" onClick={() => copiar(a.url)}>
                  Copiar link
                </Botao>
                <Botao variante="fantasma" disabled={ocupado} onClick={() => regenerar(a)}>
                  Regenerar
                </Botao>
              </div>
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}
