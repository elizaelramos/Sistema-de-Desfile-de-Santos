"use client";

import { useState } from "react";

/** Executa uma ação assíncrona controlando "ocupado" e a mensagem de erro. */
export function useAcao() {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function executar(fn: () => Promise<unknown>) {
    setOcupado(true);
    setErro("");
    try {
      await fn();
      return true;
    } catch (e) {
      setErro((e as Error).message);
      return false;
    } finally {
      setOcupado(false);
    }
  }

  return { executar, ocupado, erro, setErro };
}
