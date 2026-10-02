"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { formatarData } from "@/lib/datas";
import { useAcao } from "@/lib/use-acao";
import { Aviso, Botao, Campo, Carregando, Cartao } from "@/components/ui";
import { Cabecalho } from "@/components/organizador/cabecalho";

type Papel = "SUPER_ADMIN" | "ORGANIZADOR";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  criadoEm: string;
  eventos: number;
};

const NOME_PAPEL: Record<Papel, string> = {
  SUPER_ADMIN: "Super admin",
  ORGANIZADOR: "Coordenador",
};

function SeletorPapel({ name, defaultValue }: { name: string; defaultValue?: Papel }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">Papel</span>
      <select
        name={name}
        defaultValue={defaultValue ?? "ORGANIZADOR"}
        className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3"
      >
        <option value="ORGANIZADOR">Coordenador — cria e gerencia os próprios desfiles</option>
        <option value="SUPER_ADMIN">Super admin — também gerencia coordenadores</option>
      </select>
    </label>
  );
}

export function GestaoUsuarios({ meuId }: { meuId: string }) {
  const { data: usuarios, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => api<Usuario[]>("/api/admin/organizadores"),
  });
  const [criando, setCriando] = useState(false);

  return (
    <>
      <Cabecalho titulo="Coordenadores" voltar="/painel" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-zinc-600">
            Cada coordenador entra com e-mail e senha e cria os próprios desfiles; ele só vê os eventos dele.
          </p>
          {!criando && <Botao onClick={() => setCriando(true)}>+ Novo</Botao>}
        </div>

        {criando && (
          <NovoUsuario
            aoConcluir={async () => {
              setCriando(false);
              await refetch();
            }}
            aoCancelar={() => setCriando(false)}
          />
        )}

        {!usuarios && <Carregando />}
        <div className="flex flex-col gap-3">
          {usuarios?.map((u) => (
            <LinhaUsuario key={u.id} usuario={u} eu={u.id === meuId} atualizar={refetch} />
          ))}
        </div>
      </main>
    </>
  );
}

function NovoUsuario({ aoConcluir, aoCancelar }: { aoConcluir: () => Promise<void>; aoCancelar: () => void }) {
  const { executar, ocupado, erro } = useAcao();

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await executar(() =>
      api("/api/admin/organizadores", {
        body: { nome: f.get("nome"), email: f.get("email"), senha: f.get("senha"), papel: f.get("papel") },
      }),
    );
    if (ok) await aoConcluir();
  }

  return (
    <Cartao>
      <h3 className="mb-3 font-semibold">Novo usuário</h3>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome" name="nome" required maxLength={120} />
          <Campo rotulo="E-mail" name="email" type="email" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Senha inicial" name="senha" type="text" minLength={8} required autoComplete="new-password" />
          <SeletorPapel name="papel" />
        </div>
        <p className="text-xs text-zinc-500">Passe a senha inicial para a pessoa; ela entra em /login.</p>
        {erro && <Aviso>{erro}</Aviso>}
        <div className="flex gap-2">
          <Botao disabled={ocupado}>Criar</Botao>
          <Botao type="button" variante="fantasma" onClick={aoCancelar}>
            Cancelar
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}

function LinhaUsuario({ usuario: u, eu, atualizar }: { usuario: Usuario; eu: boolean; atualizar: () => unknown }) {
  const [editando, setEditando] = useState(false);
  const { executar, ocupado, erro } = useAcao();
  const [aviso, setAviso] = useState("");

  async function enviar(corpo: Record<string, unknown>, mensagem: string) {
    setAviso("");
    const ok = await executar(() => api(`/api/admin/organizadores/${u.id}`, { method: "PATCH", body: corpo }));
    if (ok) {
      setAviso(mensagem);
      setEditando(false);
      await atualizar();
    }
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const senha = String(f.get("senha") ?? "");
    await enviar(
      { nome: f.get("nome"), papel: f.get("papel"), ...(senha && { senha }) },
      senha ? "Salvo. A nova senha já vale." : "Salvo.",
    );
  }

  function alternarAtivo() {
    const msg = u.ativo
      ? `Desativar ${u.nome}? A pessoa é desconectada e não consegue mais entrar. Os eventos dela são mantidos.`
      : `Reativar ${u.nome}?`;
    if (!confirm(msg)) return;
    enviar({ ativo: !u.ativo }, u.ativo ? "Desativado." : "Reativado.");
  }

  return (
    <Cartao className={u.ativo ? "" : "opacity-60"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">
            {u.nome} {eu && <span className="text-sm font-normal text-zinc-500">(você)</span>}
          </h3>
          <p className="text-sm text-zinc-500">{u.email}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {u.eventos} {u.eventos === 1 ? "evento" : "eventos"} · desde {formatarData(u.criadoEm)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              u.papel === "SUPER_ADMIN" ? "bg-marca-100 text-marca-700" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {NOME_PAPEL[u.papel]}
          </span>
          {!u.ativo && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs">Desativado</span>}
        </div>
      </div>

      {editando ? (
        <form onSubmit={salvar} className="mt-3 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Nome" name="nome" defaultValue={u.nome} required maxLength={120} />
            {eu ? (
              <input type="hidden" name="papel" value={u.papel} />
            ) : (
              <SeletorPapel name="papel" defaultValue={u.papel} />
            )}
          </div>
          <Campo
            rotulo="Nova senha (deixe em branco para manter)"
            name="senha"
            type="text"
            minLength={8}
            autoComplete="new-password"
          />
          {erro && <Aviso>{erro}</Aviso>}
          <div className="flex gap-2">
            <Botao disabled={ocupado}>Salvar</Botao>
            <Botao type="button" variante="fantasma" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {erro && <Aviso>{erro}</Aviso>}
          {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
          <div className="flex flex-wrap gap-1">
            <Botao variante="secundario" onClick={() => setEditando(true)}>
              Editar
            </Botao>
            {!eu && (
              <Botao variante={u.ativo ? "fantasma" : "secundario"} disabled={ocupado} onClick={alternarAtivo}>
                {u.ativo ? "Desativar" : "Reativar"}
              </Botao>
            )}
          </div>
        </div>
      )}
    </Cartao>
  );
}
