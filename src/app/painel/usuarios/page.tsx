import { redirect } from "next/navigation";
import { organizadorAtual } from "@/lib/auth";
import { GestaoUsuarios } from "@/components/admin/gestao-usuarios";

export default async function PaginaUsuarios() {
  const org = await organizadorAtual();
  if (!org) redirect("/login");
  if (org.papel !== "SUPER_ADMIN") redirect("/painel");
  return <GestaoUsuarios meuId={org.id} />;
}
