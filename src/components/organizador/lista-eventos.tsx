"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { formatarData } from "@/lib/datas";
import { Botao, Carregando, Cartao } from "@/components/ui";
import { Cabecalho } from "./cabecalho";
import { FormNovoEvento } from "./form-evento";

type Evento = {
  id: string;
  nome: string;
  data: string;
  local: string;
  status: "ATIVO" | "ENCERRADO";
  _count: { participantes: number };
};

export function ListaEventos({ nomeOrganizador }: { nomeOrganizador: string }) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const { data: eventos, isLoading } = useQuery({
    queryKey: ["eventos"],
    queryFn: () => api<Evento[]>("/api/org/eventos"),
  });

  return (
    <>
      <Cabecalho titulo={`Olá, ${nomeOrganizador}`} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Eventos</h2>
          {!criando && <Botao onClick={() => setCriando(true)}>+ Novo evento</Botao>}
        </div>

        {criando && (
          <Cartao>
            <h3 className="mb-3 font-semibold">Novo evento</h3>
            <p className="mb-3 text-sm text-zinc-500">
              O evento é criado com as categorias padrão e 3 jurados; ajuste tudo na configuração.
            </p>
            <FormNovoEvento
              textoBotao="Criar evento"
              aoEnviar={async (dados) => {
                const ev = await api<{ id: string }>("/api/org/eventos", { body: dados });
                router.push(`/painel/${ev.id}?aba=config`);
              }}
            />
            <Botao variante="fantasma" className="mt-2 w-full" onClick={() => setCriando(false)}>
              Cancelar
            </Botao>
          </Cartao>
        )}

        {isLoading && <Carregando />}
        {eventos?.length === 0 && !criando && (
          <p className="py-10 text-center text-zinc-500">Nenhum evento ainda.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {eventos?.map((e) => (
            <Link key={e.id} href={`/painel/${e.id}`}>
              <Cartao className="transition hover:border-marca-500">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{e.nome}</h3>
                  {e.status === "ENCERRADO" && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs">Encerrado</span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {formatarData(e.data)}
                  {e.local && ` · ${e.local}`}
                </p>
                <p className="mt-2 text-sm">{e._count.participantes} participantes</p>
              </Cartao>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
