import { json, rota } from "@/lib/api";
import { registrarPresenca, validarAcesso } from "@/lib/acesso";
import { painelCadastro, painelFila, painelJurado, painelLocutor } from "@/lib/paineis";

export const dynamic = "force-dynamic";

export const GET = rota(async (request: Request, ctx: RouteContext<"/api/r/[token]/estado">) => {
  const { token } = await ctx.params;
  const acesso = await validarAcesso(token);
  await registrarPresenca(acesso.id, request);
  const eventoId = acesso.eventoId;
  const evento = { nome: acesso.evento.nome };

  switch (acesso.funcao) {
    case "CADASTRO":
      return json({ evento, ...(await painelCadastro(eventoId)) });
    case "FILA":
      return json({ evento, ...(await painelFila(eventoId)) });
    case "LOCUTOR":
      return json({ evento, ...(await painelLocutor(eventoId)) });
    case "JURADO":
      return json({
        evento,
        jurado: { numero: acesso.jurado!.numero },
        ...(await painelJurado(eventoId, acesso.juradoId!)),
      });
  }
});
