/** Intervalos de polling (escopo, seção 2). */
export const POLL_INTERNO_MS = 2500;
export const POLL_PUBLICO_MS = 5000;

type Opcoes = { method?: string; body?: unknown; sessao?: string | null };

/** fetch com JSON que lança Error com a mensagem devolvida pela API. */
export async function api<T = unknown>(url: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (opcoes.sessao) headers["x-sessao"] = opcoes.sessao;
  const res = await fetch(url, {
    method: opcoes.method ?? (opcoes.body !== undefined ? "POST" : "GET"),
    headers,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    cache: "no-store",
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(dados.erro ?? `Erro ${res.status}`);
  return dados as T;
}
