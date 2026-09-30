import { json, rota } from "@/lib/api";
import { encerrarSessaoOrganizador } from "@/lib/auth";

export const POST = rota(async () => {
  await encerrarSessaoOrganizador();
  return json({ ok: true });
});
