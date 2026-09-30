import { redirect } from "next/navigation";
import { organizadorAtual } from "@/lib/auth";
import { PainelEvento, type Aba } from "@/components/organizador/painel-evento";

const ABAS: Aba[] = ["andamento", "config", "acessos", "resultados"];

export default async function PaginaEvento(props: PageProps<"/painel/[id]">) {
  if (!(await organizadorAtual())) redirect("/login");
  const { id } = await props.params;
  const { aba } = await props.searchParams;
  const inicial = ABAS.find((a) => a === aba) ?? "andamento";
  return <PainelEvento eventoId={id} abaInicial={inicial} />;
}
