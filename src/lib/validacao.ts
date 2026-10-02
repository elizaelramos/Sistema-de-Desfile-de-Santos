import { z } from "zod";

const texto = (campo: string, max = 120) =>
  z.string().trim().min(1, `Informe ${campo}`).max(max, `${campo} muito longo`);

export const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

const senha = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(200);
const papel = z.enum(["SUPER_ADMIN", "ORGANIZADOR"]);

export const esquemaNovoOrganizador = z.object({
  nome: texto("o nome", 120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha,
  papel,
});

export const esquemaEdicaoOrganizador = z.object({
  nome: texto("o nome", 120).optional(),
  papel: papel.optional(),
  ativo: z.boolean().optional(),
  senha: senha.optional(),
});

export const esquemaNovoEvento = z.object({
  nome: texto("o nome do evento"),
  data: z.coerce.date({ error: "Data inválida" }),
  local: z.string().trim().max(200).default(""),
});

export const esquemaEvento = esquemaNovoEvento.extend({
  desempateIdade: z.enum(["MAIS_VELHO", "MAIS_NOVO"]),
  exibirPrimeiroNome: z.boolean(),
  jurados: z.number().int().min(1, "Pelo menos 1 jurado").max(20, "No máximo 20 jurados"),
  cadastradores: z
    .number()
    .int()
    .min(1, "Pelo menos 1 cadastrador")
    .max(20, "No máximo 20 cadastradores"),
});

export const esquemaCategorias = z.object({
  categorias: z
    .array(
      z.object({
        id: z.string().optional(),
        nome: texto("o nome da categoria", 60),
        idadeMin: z.number().int().min(0).max(150),
        idadeMax: z.number().int().min(0).max(150),
      }),
    )
    .min(1, "Cadastre pelo menos uma categoria"),
});

export const esquemaQuesitos = z.object({
  quesitos: z
    .array(z.object({ id: z.string().optional(), nome: texto("o nome do quesito", 60) }))
    .min(1, "Cadastre pelo menos um quesito"),
});

export const esquemaAcaoCategoria = z.object({
  acao: z.enum(["abrir", "fechar", "revelar"]),
  motivo: z.string().trim().max(500).optional(),
});

export const esquemaLiberacaoManual = z.object({
  participanteId: z.string(),
  motivo: texto("o motivo", 500),
});

export const esquemaEntrar = z.object({ nome: texto("seu nome", 60) });

export const esquemaParticipante = z.object({
  numero: z.number({ error: "Informe o número" }).int().min(1, "Número inválido").max(99999),
  nome: texto("o nome", 120),
  idade: z.number({ error: "Informe a idade" }).int().min(0, "Idade inválida").max(150, "Idade inválida"),
  santo: texto("o santo representado", 120),
});

export const esquemaAcaoFila = z.object({
  acao: z.enum(["presente", "ausente", "liberar"]),
  participanteId: z.string(),
});

export const esquemaNotas = z.object({
  participanteId: z.string(),
  notas: z.array(z.object({ quesitoId: z.string(), valor: z.number().int().min(1).max(10) })),
});
