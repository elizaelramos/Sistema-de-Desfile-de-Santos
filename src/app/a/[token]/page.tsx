import type { Metadata } from "next";
import { ErroApp } from "@/lib/api";
import { tituloAcesso, validarAcesso } from "@/lib/acesso";
import { TelaFuncao } from "@/components/funcoes/tela-funcao";

export const metadata: Metadata = { robots: { index: false } };

async function carregar(token: string) {
  try {
    return { acesso: await validarAcesso(token) };
  } catch (e) {
    if (e instanceof ErroApp) return { erro: e.message };
    throw e;
  }
}

export default async function PaginaFuncao(props: PageProps<"/a/[token]">) {
  const { token } = await props.params;
  const { acesso, erro } = await carregar(token);

  if (!acesso)
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="text-xl font-bold">{erro}</h1>
        <p className="text-zinc-500">Peça ao organizador o QR Code atualizado.</p>
      </main>
    );

  const titulo = tituloAcesso(acesso);
  return <TelaFuncao token={token} funcao={acesso.funcao} titulo={titulo} evento={acesso.evento.nome} />;
}
