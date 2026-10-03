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

  // Normalize JDBC format if provided: jdbc:postgresql://host:port/database
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

function createClient(): PrismaClient {
  const pool = getOrCreatePool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

