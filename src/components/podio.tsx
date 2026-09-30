type Podio = {
  categoria: string;
  itens: { posicao: number; numero: number; nome: string; santo: string }[];
};

const MEDALHAS = ["🥇", "🥈", "🥉"];

export function Podio({ podio, telao }: { podio: Podio; telao?: boolean }) {
  return (
    <section
      className={`rounded-3xl p-6 ${telao ? "bg-white/10 text-white" : "border-2 border-ouro bg-amber-50 text-zinc-900"}`}
    >
      <p className={`text-center font-bold uppercase tracking-wide ${telao ? "text-3xl text-ouro" : "text-lg text-amber-700"}`}>
        Resultado — {podio.categoria}
      </p>
      <ol className="mt-4 flex flex-col gap-3">
        {podio.itens.map((i) => (
          <li key={i.posicao} className="flex items-center gap-4">
            <span className={telao ? "text-6xl" : "text-4xl"}>{MEDALHAS[i.posicao - 1]}</span>
            <div className="min-w-0">
              <p className={`font-bold leading-tight ${telao ? "text-4xl" : "text-2xl"}`}>
                nº {i.numero} — {i.nome}
              </p>
              <p className={telao ? "text-2xl opacity-80" : "text-lg text-zinc-600"}>{i.santo}</p>
            </div>
          </li>
        ))}
        {!podio.itens.length && <li className="text-center">Nenhum participante desfilou.</li>}
      </ol>
    </section>
  );
}
