import { json, rota } from "@/lib/api";
import { painelPublicoEmCache } from "@/lib/paineis";

export const dynamic = "force-dynamic";

export const GET = rota(async (_req: Request, ctx: RouteContext<"/api/publico/[slug]">) => {
  const { slug } = await ctx.params;
  const dados = await painelPublicoEmCache(slug);
  if (!dados) return json({ erro: "Evento não encontrado" }, { status: 404 });
  return json(dados, {
    headers: { "Cache-Control": "public, max-age=2, s-maxage=3, stale-while-revalidate=5" },
  });
});
