/**
 * Cria um evento de ensaio com quesitos, 3 jurados e ~30 participantes fictícios.
 * Uso: npm run ensaio -- email-do-organizador@exemplo.com
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { criarEvento, salvarQuesitos } from "../src/lib/eventos";
import { cadastrarParticipante } from "../src/lib/desfile";

const NOMES = [
  "Ana Clara Souza", "Pedro Henrique Lima", "Maria Eduarda Alves", "João Miguel Costa", "Helena Ribeiro",
  "Lucas Gabriel Rocha", "Beatriz Martins", "Gabriel Ferreira", "Laura Gomes", "Rafael Barbosa",
  "Sofia Carvalho", "Davi Lucca Pereira", "Valentina Dias", "Arthur Mendes", "Isabela Nunes",
  "Bernardo Teixeira", "Manuela Castro", "Heitor Araújo", "Alice Cardoso", "Samuel Moreira",
  "Cecília Pinto", "Enzo Ramos", "Lívia Correia", "Theo Monteiro", "Giovanna Freitas",
  "Antônio Batista", "Francisca Oliveira", "José Carlos Silva", "Terezinha Santos", "Sebastião Vieira",
];
const SANTOS = [
  "Santa Teresinha", "São Francisco de Assis", "Nossa Senhora Aparecida", "São Miguel Arcanjo",
  "Santa Rita de Cássia", "São José", "Santa Clara", "São Sebastião", "Santa Dulce dos Pobres",
  "São Carlo Acutis", "Santo Antônio", "Santa Joana d'Arc", "São João Paulo II", "Santa Luzia",
];
const IDADES = [3, 4, 5, 2, 7, 9, 11, 12, 8, 10, 6, 14, 17, 22, 28, 19, 25, 13, 33, 41, 55, 38, 47, 30, 62, 70, 81, 66, 59, 16];

async function main() {
  const email = process.argv[2];
  const org = email ? await db.organizador.findUnique({ where: { email } }) : await db.organizador.findFirst();
  if (!org) {
    console.error("Organizador não encontrado. Crie um antes com: npm run organizador");
    process.exit(1);
  }

  const evento = await criarEvento(org.id, {
    nome: `Ensaio geral ${new Date().toLocaleString("pt-BR")}`,
    data: new Date(new Date().toISOString().slice(0, 10)),
    local: "Salão paroquial",
  });
  await salvarQuesitos(evento.id, [
    { nome: "Fidelidade ao santo" },
    { nome: "Criatividade" },
    { nome: "Apresentação" },
  ]);
  for (const [i, nome] of NOMES.entries()) {
    await cadastrarParticipante(evento.id, {
      numero: i + 1,
      nome,
      idade: IDADES[i],
      santo: SANTOS[i % SANTOS.length],
    });
  }
  console.log(`Evento de ensaio criado: ${evento.nome} (${NOMES.length} participantes)`);
  console.log(`Painel: /painel/${evento.id}`);
}

main().finally(() => db.$disconnect());
