"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/cliente";

export function Cabecalho({
  titulo,
  voltar,
  superAdmin,
}: {
  titulo: string;
  voltar?: string;
  superAdmin?: boolean;
}) {
  const router = useRouter();
  async function sair() {
    await api("/api/auth/logout", { body: {} });
    router.replace("/login");
  }
  return (
    <header className="sticky top-0 z-10 bg-marca-900 text-white shadow">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {voltar && (
          <Link href={voltar} className="text-marca-100 hover:text-white" aria-label="Voltar">
            ←
          </Link>
        )}
        <h1 className="flex-1 truncate font-semibold">{titulo}</h1>
        {superAdmin && (
          <Link href="/painel/usuarios" className="text-sm text-marca-100 hover:text-white">
            Coordenadores
          </Link>
        )}
        <button onClick={sair} className="text-sm text-marca-100 hover:text-white">
          Sair
        </button>
      </div>
    </header>
  );
}
