import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    process.env.JDBC_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set. Please configure PostgreSQL credentials.");
  }

  if (url.startsWith("jdbc:")) {
    url = url.replace(/^jdbc:/, "");
    if (!url.includes("@") && process.env.DATABASE_USERNAME && process.env.DATABASE_PASSWORD) {
      const user = encodeURIComponent(process.env.DATABASE_USERNAME);
      const pass = encodeURIComponent(process.env.DATABASE_PASSWORD);
      url = url.replace("postgresql://", `postgresql://${user}:${pass}@`);
    }
  }

  return url;
}

function getOrCreatePool(): Pool {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const connectionString = getDatabaseUrl();
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });

  pool.on("error", (err) => {
    console.error("[prisma/pg-pool] Unexpected error on idle client:", err);
  });

  globalForPrisma.pgPool = pool;
  return pool;
}

function getOrCreateClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const adapter = new PrismaPg(getOrCreatePool());
  const client = new PrismaClient({ adapter });
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Created on first use rather than at import, so `next build` (which imports every route while
 * collecting page data) doesn't need database credentials. A missing DATABASE_URL still fails
 * loudly — on the first query instead of at module load.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getOrCreateClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

