import type { PainelPublico } from "@/lib/paineis";

export const MEDALHAS = ["🥇", "🥈", "🥉"];

type Premiacao = NonNullable<PainelPublico["premiacao"]>;

/** Pódio do telão: cada posição fica oculta até o locutor revelar. */
export function Podio({ premiacao }: { premiacao: Premiacao }) {
  return (
    <section className="rounded-3xl bg-white/10 p-6 text-white">
      <p className="text-center text-xl font-semibold uppercase tracking-widest opacity-80 sm:text-2xl">Premiação</p>
      <p className="text-center text-3xl font-bold uppercase tracking-wide text-ouro sm:text-4xl">
        {premiacao.categoria}
      </p>
      <ol className="mt-6 flex flex-col gap-4">
        {premiacao.itens.map((i) => (
          <li key={i.posicao} className="flex min-h-24 items-center gap-4">
            <span className="text-6xl">{MEDALHAS[i.posicao - 1]}</span>
            {i.revelado ? (
              <div key="revelado" className="revelar min-w-0">
                <p className="text-4xl font-bold leading-tight">
                  nº {i.revelado.numero} — {i.revelado.nome}
                </p>
                <p className="text-2xl opacity-80">{i.revelado.santo}</p>
              </div>
            ) : (
              <p className="animate-pulse text-4xl font-bold opacity-50">{i.posicao}º lugar: ?</p>
            )}
          </li>
        ))}
        {!premiacao.itens.length && <li className="text-center">Nenhum participante desfilou.</li>}
      </ol>
    </section>
  );
}
