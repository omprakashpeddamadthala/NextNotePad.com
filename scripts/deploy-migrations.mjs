import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const baselineName = "20261003163000_postgresql_baseline";
const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);

function runPrisma(args) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to deploy database migrations.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    "SELECT pg_advisory_lock(hashtext('nextnotepad-migration-bootstrap'))",
  );

  const { rows: tableRows } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename <> '_prisma_migrations'
    LIMIT 1
  `);
  const hasExistingSchema = tableRows.length > 0;

  const { rows: migrationTableRows } = await client.query(
    "SELECT to_regclass(current_schema() || '.\"_prisma_migrations\"') AS name",
  );
  let baselineApplied = false;
  if (migrationTableRows[0]?.name) {
    const { rowCount } = await client.query(
      `SELECT 1
       FROM "_prisma_migrations"
       WHERE migration_name = $1
         AND finished_at IS NOT NULL
         AND rolled_back_at IS NULL`,
      [baselineName],
    );
    baselineApplied = (rowCount ?? 0) > 0;
  }

  if (hasExistingSchema && !baselineApplied) {
    const baselineSql = await readFile(
      new URL(
        `../prisma/migrations/${baselineName}/migration.sql`,
        import.meta.url,
      ),
      "utf8",
    );
    await client.query(baselineSql);
    runPrisma(["migrate", "resolve", "--applied", baselineName]);
  }
} finally {
  await client
    .query("SELECT pg_advisory_unlock(hashtext('nextnotepad-migration-bootstrap'))")
    .catch(() => undefined);
  await client.end();
}

runPrisma(["migrate", "deploy"]);
