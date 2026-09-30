import { redirect } from "next/navigation";
import { organizadorAtual } from "@/lib/auth";
import { ListaEventos } from "@/components/organizador/lista-eventos";

export default async function Painel() {
  const org = await organizadorAtual();
  if (!org) redirect("/login");
  return <ListaEventos nomeOrganizador={org.nome} />;
}
