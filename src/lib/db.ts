import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function criarCliente() {
  // O driver do MariaDB só aceita o esquema mariadb://
  const url = (process.env.DATABASE_URL ?? "").replace(/^mysql:\/\//, "mariadb://");
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
