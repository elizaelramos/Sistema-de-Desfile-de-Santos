export type StatusCategoria = "AGUARDANDO" | "EM_ANDAMENTO" | "FECHADA" | "REVELADA";

type ParticipanteResumo = {
  id: string;
  numero: number;
  nome: string;
  idade: number;
  santo: string;
  desfilouEm: string | null;
};

export type DadosPainel = {
  evento: {
    id: string;
    nome: string;
    data: string;
    local: string;
    slugPublico: string;
    desempateIdade: "MAIS_VELHO" | "MAIS_NOVO";
    exibirPrimeiroNome: boolean;
    status: "ATIVO" | "ENCERRADO";
  };
  categorias: {
    id: string;
    nome: string;
    idadeMin: number;
    idadeMax: number;
    ordem: number;
    status: StatusCategoria;
    total: number;
    desfilaram: number;
    ausentes: number;
  }[];
  quesitos: { id: string; nome: string; ordem: number }[];
  jurados: { id: string; numero: number; nome: string | null }[];
  aoVivo: {
    categoriaAtual: { id: string; nome: string } | null;
    participanteAtual: ParticipanteResumo | null;
    proximo: ParticipanteResumo | null;
    pendentes: { id: string; numero: number; nome: string | null }[];
  };
  ocorrencias: { id: string; tipo: string; descricao: string; criadoEm: string }[];
};
