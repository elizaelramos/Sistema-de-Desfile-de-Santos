import { randomInt } from "crypto";

export type EntradaApuracao = {
  participanteId: string;
  idade: number;
  /** Notas agrupadas por quesito, na ordem dos quesitos (1º = mais importante). */
  notasPorQuesito: number[][];
};

export type LinhaResultado = {
  participanteId: string;
  posicao: number;
  media: number;
  mediasQuesitos: number[];
  /** Critério que colocou este participante à frente do seguinte, se empatados na média. */
  criterioDesempate: string | null;
  sorteio: boolean;
};

const EPS = 1e-9;

function media(valores: number[]) {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
}

/**
 * Regras (escopo, seção 6):
 * 1. Nota final = soma das notas ÷ quantidade de notas.
 * 2. Desempate: média do 1º quesito, do 2º, ...; depois idade; depois sorteio.
 */
export function apurar(
  entradas: EntradaApuracao[],
  opcoes: {
    nomesQuesitos: string[];
    desempateIdade: "MAIS_VELHO" | "MAIS_NOVO";
    sortear?: (n: number) => number;
  },
): LinhaResultado[] {
  const sortear = opcoes.sortear ?? ((n: number) => randomInt(n));

  // Chave de sorteio atribuída de antemão; só é usada se todo o resto empatar.
  const ordemSorteio = entradas.map((_, i) => i);
  for (let i = ordemSorteio.length - 1; i > 0; i--) {
    const j = sortear(i + 1);
    [ordemSorteio[i], ordemSorteio[j]] = [ordemSorteio[j], ordemSorteio[i]];
  }

  const linhas = entradas.map((e, i) => ({
    participanteId: e.participanteId,
    idade: e.idade,
    media: media(e.notasPorQuesito.flat()),
    mediasQuesitos: e.notasPorQuesito.map(media),
    chaveSorteio: ordemSorteio[i],
  }));
  type Linha = (typeof linhas)[number];

  /** Retorna <0 se `a` fica à frente, e qual critério decidiu. */
  function comparar(a: Linha, b: Linha): { ordem: number; criterio: string | null } {
    if (Math.abs(a.media - b.media) > EPS) return { ordem: b.media - a.media, criterio: null };
    for (let q = 0; q < opcoes.nomesQuesitos.length; q++) {
      const diff = (b.mediasQuesitos[q] ?? 0) - (a.mediasQuesitos[q] ?? 0);
      if (Math.abs(diff) > EPS)
        return { ordem: diff, criterio: `${q + 1}º quesito (${opcoes.nomesQuesitos[q]})` };
    }
    if (a.idade !== b.idade) {
      const maisVelho = opcoes.desempateIdade === "MAIS_VELHO";
      return {
        ordem: maisVelho ? b.idade - a.idade : a.idade - b.idade,
        criterio: maisVelho ? "idade (mais velho)" : "idade (mais novo)",
      };
    }
    return { ordem: a.chaveSorteio - b.chaveSorteio, criterio: "sorteio" };
  }

  linhas.sort((a, b) => comparar(a, b).ordem);

  return linhas.map((l, i) => {
    const seguinte = linhas[i + 1];
    const criterio = seguinte ? comparar(l, seguinte).criterio : null;
    const anterior = linhas[i - 1];
    const sorteio =
      criterio === "sorteio" || (anterior ? comparar(anterior, l).criterio === "sorteio" : false);
    return {
      participanteId: l.participanteId,
      posicao: i + 1,
      media: l.media,
      mediasQuesitos: l.mediasQuesitos,
      criterioDesempate: criterio,
      sorteio,
    };
  });
}
