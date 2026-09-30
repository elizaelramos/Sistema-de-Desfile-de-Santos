import { json, rota } from "@/lib/api";
import { painelPublico, type PainelPublico } from "@/lib/paineis";

export const dynamic = "force-dynamic";

// Cache em memória: com centenas de celulares consultando a cada 5 s,
// o banco recebe no máximo uma consulta a cada 2 s por evento.
const TTL_MS = 2000;
const cache = new Map<string, { expira: number; dados: PainelPublico | null }>();

export const GET = rota(async (_req: Request, ctx: RouteContext<"/api/publico/[slug]">) => {
  const { slug } = await ctx.params;
  let item = cache.get(slug);
  if (!item || item.expira < Date.now()) {
    item = { expira: Date.now() + TTL_MS, dados: await painelPublico(slug) };
    cache.set(slug, item);
  }
  if (!item.dados) return json({ erro: "Evento não encontrado" }, { status: 404 });
  return json(item.dados, {
    headers: { "Cache-Control": "public, max-age=2, s-maxage=3, stale-while-revalidate=5" },
  });
});
