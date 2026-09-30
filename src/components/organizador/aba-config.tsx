"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/cliente";
import { dataParaInput } from "@/lib/datas";
import { useAcao } from "@/lib/use-acao";
import { Aviso, Botao, Campo, Cartao } from "@/components/ui";
import { FormNovoEvento } from "./form-evento";
import type { DadosPainel } from "./tipos";

type Props = { dados: DadosPainel; atualizar: () => Promise<unknown> };

export function AbaConfig({ dados, atualizar }: Props) {
  // Remonta os editores depois de salvar, para pegar os ids gerados no servidor.
  const [versao, setVersao] = useState(0);
  const recarregar = async () => {
    await atualizar();
    setVersao((v) => v + 1);
  };

  return (
    <div key={versao} className="flex flex-col gap-4">
      <DadosERegras dados={dados} recarregar={recarregar} />
      <EditorQuesitos dados={dados} recarregar={recarregar} />
      <EditorCategorias dados={dados} recarregar={recarregar} />
      <Duplicar dados={dados} />
      <Encerramento dados={dados} recarregar={recarregar} />
    </div>
  );
}

type SecaoProps = { dados: DadosPainel; recarregar: () => Promise<void> };

function Salvo({ visivel }: { visivel: boolean }) {
  return visivel ? <Aviso tipo="sucesso">Salvo.</Aviso> : null;
}

function DadosERegras({ dados, recarregar }: SecaoProps) {
  const { evento } = dados;
  const { executar, ocupado, erro } = useAcao();
  const [salvo, setSalvo] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSalvo(false);
    const ok = await executar(() =>
      api(`/api/org/eventos/${evento.id}`, {
        method: "PATCH",
        body: {
          nome: f.get("nome"),
          data: f.get("data"),
          local: f.get("local"),
          desempateIdade: f.get("desempateIdade"),
          exibirPrimeiroNome: f.get("exibirPrimeiroNome") === "sim",
          jurados: Number(f.get("jurados")),
        },
      }),
    );
    if (ok) {
      setSalvo(true);
      await recarregar();
    }
  }

  return (
    <Cartao>
      <h2 className="mb-3 font-semibold">Dados e regras</h2>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo rotulo="Nome do evento" name="nome" defaultValue={evento.nome} required />
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Data" name="data" type="date" defaultValue={dataParaInput(evento.data)} required />
          <Campo rotulo="Local" name="local" defaultValue={evento.local} className="sm:col-span-2" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo
            rotulo="Número de jurados"
            name="jurados"
            type="number"
            min={1}
            max={20}
            defaultValue={dados.jurados.length}
            required
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Desempate por idade</span>
            <select
              name="desempateIdade"
              defaultValue={evento.desempateIdade}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3"
            >
              <option value="MAIS_VELHO">Vence o mais velho</option>
              <option value="MAIS_NOVO">Vence o mais novo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Nome na página pública</span>
            <select
              name="exibirPrimeiroNome"
              defaultValue={evento.exibirPrimeiroNome ? "sim" : "nao"}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3"
            >
              <option value="nao">Nome completo</option>
              <option value="sim">Só o primeiro nome</option>
            </select>
          </label>
        </div>
        {erro && <Aviso>{erro}</Aviso>}
        <Salvo visivel={salvo} />
        <Botao disabled={ocupado}>Salvar</Botao>
      </form>
    </Cartao>
  );
}

function mover<T>(lista: T[], i: number, delta: number) {
  const j = i + delta;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

function BotoesOrdem({ aoSubir, aoDescer, aoRemover }: { aoSubir: () => void; aoDescer: () => void; aoRemover: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Botao type="button" variante="secundario" onClick={aoSubir} aria-label="Subir">
        ↑
      </Botao>
      <Botao type="button" variante="secundario" onClick={aoDescer} aria-label="Descer">
        ↓
      </Botao>
      <Botao type="button" variante="secundario" onClick={aoRemover} aria-label="Remover">
        ✕
      </Botao>
    </div>
  );
}

function EditorQuesitos({ dados, recarregar }: SecaoProps) {
  const [itens, setItens] = useState(dados.quesitos.map((q) => ({ id: q.id as string | undefined, nome: q.nome })));
  const { executar, ocupado, erro } = useAcao();
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvo(false);
    const ok = await executar(() =>
      api(`/api/org/eventos/${dados.evento.id}/quesitos`, { method: "PUT", body: { quesitos: itens } }),
    );
    if (ok) {
      setSalvo(true);
      await recarregar();
    }
  }

  return (
    <Cartao>
      <h2 className="font-semibold">Quesitos</h2>
      <p className="mb-3 text-sm text-zinc-500">
        O 1º quesito é o mais importante e é o primeiro critério de desempate. Cada jurado dá nota de 1 a 10 em cada
        quesito.
      </p>
      {!itens.length && <Aviso tipo="info">Nenhum quesito cadastrado. Cadastre antes de abrir a primeira categoria.</Aviso>}
      <ol className="flex flex-col gap-2">
        {itens.map((q, i) => (
          <li key={q.id ?? `novo-${i}`} className="flex items-center gap-2">
            <span className="w-6 text-right text-sm font-semibold text-zinc-500">{i + 1}º</span>
            <input
              value={q.nome}
              onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))}
              placeholder="Ex.: Fidelidade ao santo"
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-zinc-300 px-3"
            />
            <BotoesOrdem
              aoSubir={() => setItens(mover(itens, i, -1))}
              aoDescer={() => setItens(mover(itens, i, 1))}
              aoRemover={() => setItens(itens.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-col gap-2">
        {erro && <Aviso>{erro}</Aviso>}
        <Salvo visivel={salvo} />
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={() => setItens([...itens, { id: undefined, nome: "" }])}>
            + Quesito
          </Botao>
          <Botao disabled={ocupado} onClick={salvar}>
            Salvar quesitos
          </Botao>
        </div>
      </div>
    </Cartao>
  );
}

function EditorCategorias({ dados, recarregar }: SecaoProps) {
  const [itens, setItens] = useState(
    dados.categorias.map((c) => ({
      id: c.id as string | undefined,
      nome: c.nome,
      idadeMin: String(c.idadeMin),
      idadeMax: String(c.idadeMax),
    })),
  );
  const { executar, ocupado, erro } = useAcao();
  const [salvo, setSalvo] = useState(false);

  function alterar(i: number, campo: "nome" | "idadeMin" | "idadeMax", valor: string) {
    setItens(itens.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));
  }

  async function salvar() {
    setSalvo(false);
    const categorias = itens.map((c) => ({
      id: c.id,
      nome: c.nome,
      idadeMin: Number(c.idadeMin),
      idadeMax: Number(c.idadeMax),
    }));
    const ok = await executar(() =>
      api(`/api/org/eventos/${dados.evento.id}/categorias`, { method: "PUT", body: { categorias } }),
    );
    if (ok) {
      setSalvo(true);
      await recarregar();
    }
  }

  return (
    <Cartao>
      <h2 className="font-semibold">Categorias</h2>
      <p className="mb-3 text-sm text-zinc-500">
        A ordem da lista é a ordem de desfile. A categoria do participante é definida pela idade.
      </p>
      <div className="flex flex-col gap-2">
        {itens.map((c, i) => (
          <div key={c.id ?? `nova-${i}`} className="flex flex-wrap items-end gap-2 rounded-xl bg-zinc-50 p-2">
            <label className="flex min-w-32 flex-1 flex-col text-xs text-zinc-500">
              Nome
              <input
                value={c.nome}
                onChange={(e) => alterar(i, "nome", e.target.value)}
                className="min-h-10 rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900"
              />
            </label>
            <label className="flex w-20 flex-col text-xs text-zinc-500">
              De (anos)
              <input
                type="number"
                min={0}
                value={c.idadeMin}
                onChange={(e) => alterar(i, "idadeMin", e.target.value)}
                className="min-h-10 rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900"
              />
            </label>
            <label className="flex w-20 flex-col text-xs text-zinc-500">
              Até (anos)
              <input
                type="number"
                min={0}
                value={c.idadeMax}
                onChange={(e) => alterar(i, "idadeMax", e.target.value)}
                className="min-h-10 rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900"
              />
            </label>
            <BotoesOrdem
              aoSubir={() => setItens(mover(itens, i, -1))}
              aoDescer={() => setItens(mover(itens, i, 1))}
              aoRemover={() => setItens(itens.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {erro && <Aviso>{erro}</Aviso>}
        <Salvo visivel={salvo} />
        <div className="flex gap-2">
          <Botao
            variante="secundario"
            onClick={() => setItens([...itens, { id: undefined, nome: "", idadeMin: "", idadeMax: "" }])}
          >
            + Categoria
          </Botao>
          <Botao disabled={ocupado} onClick={salvar}>
            Salvar categorias
          </Botao>
        </div>
      </div>
    </Cartao>
  );
}

function Duplicar({ dados }: { dados: DadosPainel }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  return (
    <Cartao>
      <h2 className="font-semibold">Duplicar evento</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Cria um novo evento com as mesmas categorias, quesitos, número de jurados e regras (sem participantes).
      </p>
      {aberto ? (
        <FormNovoEvento
          inicial={{ nome: `${dados.evento.nome} (cópia)`, local: dados.evento.local }}
          textoBotao="Criar cópia"
          aoEnviar={async (novo) => {
            const ev = await api<{ id: string }>(`/api/org/eventos/${dados.evento.id}/duplicar`, { body: novo });
            router.push(`/painel/${ev.id}?aba=config`);
          }}
        />
      ) : (
        <Botao variante="secundario" onClick={() => setAberto(true)}>
          Duplicar
        </Botao>
      )}
    </Cartao>
  );
}

function Encerramento({ dados, recarregar }: SecaoProps) {
  const { executar, ocupado, erro } = useAcao();
  const encerrado = dados.evento.status === "ENCERRADO";

  async function alternar() {
    const msg = encerrado
      ? "Reativar o evento? Os QR Codes voltam a funcionar."
      : "Encerrar o evento? Todos os QR Codes deixam de funcionar.";
    if (!confirm(msg)) return;
    await executar(() =>
      api(`/api/org/eventos/${dados.evento.id}`, {
        method: "PATCH",
        body: { status: encerrado ? "ATIVO" : "ENCERRADO" },
      }),
    );
    await recarregar();
  }

  return (
    <Cartao>
      <h2 className="font-semibold">{encerrado ? "Evento encerrado" : "Encerrar evento"}</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Ao encerrar, os QR Codes de todas as funções expiram. A página pública continua mostrando o último pódio.
      </p>
      {erro && <Aviso>{erro}</Aviso>}
      <Botao variante={encerrado ? "secundario" : "perigo"} disabled={ocupado} onClick={alternar}>
        {encerrado ? "Reativar evento" : "Encerrar evento"}
      </Botao>
    </Cartao>
  );
}
