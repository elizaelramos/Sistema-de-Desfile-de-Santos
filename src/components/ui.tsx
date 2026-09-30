"use client";

import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

const VARIANTES = {
  primario: "bg-marca-700 text-white hover:bg-marca-600 disabled:bg-zinc-300 disabled:text-zinc-500",
  secundario:
    "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
  sucesso: "bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-zinc-300 disabled:text-zinc-500",
  perigo: "bg-red-600 text-white hover:bg-red-500 disabled:bg-zinc-300 disabled:text-zinc-500",
  fantasma: "text-marca-700 hover:bg-marca-50 disabled:text-zinc-400",
} as const;

export function Botao({
  variante = "primario",
  grande,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof VARIANTES; grande?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${
        grande ? "min-h-14 px-6 text-lg" : "min-h-10 px-4 text-sm"
      } ${VARIANTES[variante]} ${className}`}
    />
  );
}

export function Campo({
  rotulo,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-zinc-700">{rotulo}</span>
      <input
        {...props}
        className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
      />
    </label>
  );
}

export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function Aviso({ tipo = "erro", children }: { tipo?: "erro" | "info" | "sucesso"; children: ReactNode }) {
  const cores = {
    erro: "bg-red-50 text-red-800 border-red-200",
    info: "bg-amber-50 text-amber-900 border-amber-200",
    sucesso: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return <div className={`rounded-xl border px-3 py-2 text-sm ${cores[tipo]}`}>{children}</div>;
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return <p className="py-10 text-center text-zinc-500">{texto}</p>;
}

const COR_STATUS: Record<string, string> = {
  AGUARDANDO: "bg-zinc-100 text-zinc-700",
  PRESENTE: "bg-emerald-100 text-emerald-800",
  AUSENTE: "bg-amber-100 text-amber-800",
  DESFILOU: "bg-marca-100 text-marca-700",
  EM_ANDAMENTO: "bg-emerald-100 text-emerald-800",
  FECHADA: "bg-sky-100 text-sky-800",
  REVELADA: "bg-marca-100 text-marca-700",
};

const NOME_STATUS: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  DESFILOU: "Desfilou",
  EM_ANDAMENTO: "Em andamento",
  FECHADA: "Fechada",
  REVELADA: "Revelada",
};

export function Selo({ status }: { status: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${COR_STATUS[status] ?? ""}`}>
      {NOME_STATUS[status] ?? status}
    </span>
  );
}
