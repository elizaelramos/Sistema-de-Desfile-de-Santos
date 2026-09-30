import QRCode from "qrcode";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, rota } from "@/lib/api";
import { exigirEventoDoOrganizador } from "@/lib/auth";
import { JANELA_CONEXAO_MS, NOME_FUNCAO } from "@/lib/acesso";
import { regenerarAcesso } from "@/lib/eventos";
import { urlBase } from "@/lib/url";

const ORDEM = { CADASTRO: 1, FILA: 2, LOCUTOR: 3, JURADO: 4 } as const;

async function qr(url: string) {
  return QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "M" });
}

/** QR Codes de cada função, com quem está conectado. */
export const GET = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/acessos">) => {
  const { id } = await ctx.params;
  const evento = await exigirEventoDoOrganizador(id);
  const base = urlBase(request);
  const limite = new Date(Date.now() - JANELA_CONEXAO_MS);

  const acessos = await db.acesso.findMany({
    where: { eventoId: id },
    include: {
      jurado: true,
      sessoes: { orderBy: { ultimoAcesso: "desc" } },
    },
  });
  acessos.sort(
    (a, b) => ORDEM[a.funcao] - ORDEM[b.funcao] || (a.jurado?.numero ?? 0) - (b.jurado?.numero ?? 0),
  );

  const urlPublica = `${base}/p/${evento.slugPublico}`;
  return json({
    publico: { url: urlPublica, qr: await qr(urlPublica) },
    acessos: await Promise.all(
      acessos.map(async (a) => {
        const url = `${base}/a/${a.token}`;
        return {
          id: a.id,
          funcao: a.funcao,
          titulo: a.jurado ? `Jurado ${a.jurado.numero}` : NOME_FUNCAO[a.funcao],
          url,
          qr: await qr(url),
          sessoes: a.sessoes.map((s) => ({
            id: s.id,
            nome: s.nomePessoa,
            ultimoAcesso: s.ultimoAcesso,
            conectado: s.ultimoAcesso > limite,
          })),
        };
      }),
    ),
  });
});

export const POST = rota(async (request: Request, ctx: RouteContext<"/api/org/eventos/[id]/acessos">) => {
  const { id } = await ctx.params;
  await exigirEventoDoOrganizador(id);
  const { acessoId } = z.object({ acessoId: z.string() }).parse(await request.json());
  await regenerarAcesso(id, acessoId);
  return json({ ok: true });
});
