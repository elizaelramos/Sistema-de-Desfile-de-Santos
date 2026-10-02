import { json, rota } from "@/lib/api";
import { exigirSuperAdmin } from "@/lib/auth";
import { criarOrganizador, listarOrganizadores } from "@/lib/organizadores";
import { esquemaNovoOrganizador } from "@/lib/validacao";

export const GET = rota(async () => {
  await exigirSuperAdmin();
  return json(await listarOrganizadores());
});

export const POST = rota(async (request: Request) => {
  await exigirSuperAdmin();
  const dados = esquemaNovoOrganizador.parse(await request.json());
  return json(await criarOrganizador(dados), { status: 201 });
});
