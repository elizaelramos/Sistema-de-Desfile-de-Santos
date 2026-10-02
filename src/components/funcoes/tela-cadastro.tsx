"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { useAcao } from "@/lib/use-acao";
import type { PainelCadastro } from "@/lib/paineis";
import { Aviso, Botao, Campo, Cartao, Selo } from "@/components/ui";
import { useEstado, type PropsFuncao } from "./use-estado";

type Participante = {
  id: string;
  numero: number;
  nome: string;
  idade: number;
  santo: string;
  status: string;
  categoria: { nome: string };
};

type Form = { numero: string; nome: string; idade: string; santo: string };
const VAZIO: Form = { numero: "", nome: "", idade: "", santo: "" };

export function TelaCadastro(props: PropsFuncao) {
  const { token } = props;
  const queryClient = useQueryClient();
  const { data: estado } = useEstado<PainelCadastro>(props);
  const [form, setForm] = useState<Form>(VAZIO);
  const [editando, setEditando] = useState<Participante | null>(null);
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const { executar, ocupado, erro, setErro } = useAcao();

  const { data: encontrados } = useQuery({
    queryKey: ["participantes", token, busca],
    queryFn: () =>
      api<Participante[]>(`/api/r/${token}/participantes?q=${encodeURIComponent(busca)}`),
  });

  const idade = Number(form.idade);
  const categoria =
    form.idade !== ""
      ? estado?.categorias.find((c) => idade >= c.idadeMin && idade <= c.idadeMax)
      : undefined;

  function alterar(campo: keyof Form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setSucesso("");
  }

  function limpar() {
    setForm(VAZIO);
    setEditando(null);
    setErro("");
  }

  function editar(p: Participante) {
    setEditando(p);
    setForm({ numero: String(p.numero), nome: p.nome, idade: String(p.idade), santo: p.santo });
    setSucesso("");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const corpo = { numero: Number(form.numero), nome: form.nome, idade: Number(form.idade), santo: form.santo };
    const ok = await executar(async () => {
      const p = editando
        ? await api<Participante>(`/api/r/${token}/participantes/${editando.id}`, { method: "PATCH", body: corpo })
        : await api<Participante>(`/api/r/${token}/participantes`, { body: corpo });
      setSucesso(`Nº ${p.numero} — ${p.nome} ${editando ? "atualizado" : "cadastrado"} em ${p.categoria.nome}`);
    });
    if (ok) {
      limpar();
      queryClient.invalidateQueries({ queryKey: ["estado", token] });
      queryClient.invalidateQueries({ queryKey: ["participantes", token] });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <Cartao>
        <h2 className="mb-3 text-lg font-bold">{editando ? `Corrigir nº ${editando.numero}` : "Novo participante"}</h2>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo
              rotulo="Nº do adesivo"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Nº que está na mão"
              value={form.numero}
              onChange={(e) => alterar("numero", e.target.value)}
              required
              autoFocus
            />
            <Campo
              rotulo="Idade"
              type="number"
              inputMode="numeric"
              min={0}
              max={150}
              value={form.idade}
              onChange={(e) => alterar("idade", e.target.value)}
              required
            />
          </div>
          <Campo rotulo="Nome" value={form.nome} onChange={(e) => alterar("nome", e.target.value)} required />
          <Campo
            rotulo="Santo representado"
            value={form.santo}
            onChange={(e) => alterar("santo", e.target.value)}
            required
          />
          {form.idade !== "" && (
            <p className="text-sm">
              Categoria:{" "}
              {categoria ? (
                <b>
                  {categoria.nome}
                  {categoria.status === "EM_ANDAMENTO" && " (em andamento — entra no fim da fila)"}
                </b>
              ) : (
                <span className="text-red-700">nenhuma categoria para esta idade</span>
              )}
            </p>
          )}
          {erro && <Aviso>{erro}</Aviso>}
          {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
          <Botao grande disabled={ocupado}>
            {editando ? "Salvar correção" : "Cadastrar"}
          </Botao>
          {editando && (
            <Botao type="button" variante="secundario" onClick={limpar}>
              Cancelar correção
            </Botao>
          )}
        </form>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 font-semibold">Buscar para corrigir</h2>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Número, nome ou santo"
          className="mb-3 min-h-12 w-full rounded-xl border border-zinc-300 px-3"
        />
        <ul className="divide-y divide-zinc-100">
          {encontrados?.map((p) => (
            <li key={p.id}>
              <button onClick={() => editar(p)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-zinc-50">
                <span className="w-12 text-lg font-bold text-marca-700">{p.numero}</span>
                <span className="flex-1">
                  {p.nome}
                  <span className="block text-xs text-zinc-500">
                    {p.santo} · {p.idade} anos · {p.categoria.nome}
                  </span>
                </span>
                <Selo status={p.status} />
              </button>
            </li>
          ))}
          {encontrados?.length === 0 && <li className="py-2 text-sm text-zinc-500">Nenhum participante encontrado.</li>}
        </ul>
      </Cartao>
    </main>
  );
}
