"use client";

import { useQuery } from "@tanstack/react-query";
import { api, POLL_INTERNO_MS } from "@/lib/cliente";

export type PropsFuncao = { token: string; sessao: string };

/** Estado da função, atualizado por polling a cada 2,5 s. */
export function useEstado<T>({ token, sessao }: PropsFuncao) {
  return useQuery({
    queryKey: ["estado", token],
    queryFn: () => api<T>(`/api/r/${token}/estado`, { sessao }),
    refetchInterval: POLL_INTERNO_MS,
  });
}
