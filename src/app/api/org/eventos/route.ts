import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { exigirOrganizador } from "@/lib/auth";
import { criarEvento } from "@/lib/eventos";
import { esquemaNovoEvento } from "@/lib/validacao";

export const GET = rota(async () => {
  const org = await exigirOrganizador();
  const eventos = await db.evento.findMany({
    where: { organizadorId: org.id },
    orderBy: { data: "desc" },
    include: { _count: { select: { participantes: true } } },
  });
  return json(eventos);
});

export const POST = rota(async (request: Request) => {
  const org = await exigirOrganizador();
  const dados = esquemaNovoEvento.parse(await request.json());
  const evento = await criarEvento(org.id, dados);
  return json(evento, { status: 201 });
});
