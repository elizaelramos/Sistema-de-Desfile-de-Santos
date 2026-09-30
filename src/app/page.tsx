import { redirect } from "next/navigation";
import { organizadorAtual } from "@/lib/auth";

export default async function Inicio() {
  redirect((await organizadorAtual()) ? "/painel" : "/login");
}
