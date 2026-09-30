import { randomBytes } from "crypto";

/** Token longo e aleatório para QR Codes e sessões (256 bits). */
export function gerarToken() {
  return randomBytes(32).toString("base64url");
}

/** Identificador curto e legível para a URL pública do evento. */
export function gerarSlug() {
  return randomBytes(5).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x");
}
