import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set in .env.local");
}

async function main() {
  const db = createClient({ url: url!, authToken });

  const schemaPath = join(process.cwd(), "src", "db", "schema.sql");
  const rawSchema = readFileSync(schemaPath, "utf-8");

  // Удаляем комментарии (строки начинающиеся с --)
  const schema = rawSchema
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Applying ${statements.length} statements to ${url}...`);

  for (const stmt of statements) {
    try {
      await db.execute(stmt);
      const firstLine = stmt.split("\n")[0].slice(0, 60);
      console.log(`  OK ${firstLine}...`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // ALTER TABLE ADD COLUMN: пропускаем «column already exists»
      if (stmt.startsWith("ALTER TABLE") && msg.includes("duplicate column")) {
        const firstLine = stmt.split("\n")[0].slice(0, 60);
        console.log(`  SKIP ${firstLine}... (column already exists)`);
      } else {
        throw e;
      }
    }
  }

  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
