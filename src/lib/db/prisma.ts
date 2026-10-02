import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;
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

function createClient() {
  const connectionString = getDatabaseUrl();
  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
