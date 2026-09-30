/** Datas do evento são guardadas como meia-noite UTC do dia escolhido. */
export function dataParaInput(iso: string | Date) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function formatarData(iso: string | Date) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatarHora(iso: string | Date) {
  return new Date(iso).toLocaleString("pt-BR");
}
