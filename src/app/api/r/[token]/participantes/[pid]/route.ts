import { json, rota } from "@/lib/api";
import { validarAcesso } from "@/lib/acesso";
import { editarParticipante } from "@/lib/desfile";
import { esquemaParticipante } from "@/lib/validacao";

export const PATCH = rota(
  async (request: Request, ctx: RouteContext<"/api/r/[token]/participantes/[pid]">) => {
    const { token, pid } = await ctx.params;
    const acesso = await validarAcesso(token, ["CADASTRO"]);
    const dados = esquemaParticipante.parse(await request.json());
    const participante = await editarParticipante(acesso.eventoId, pid, dados);
    return json(participante);
  },
);
