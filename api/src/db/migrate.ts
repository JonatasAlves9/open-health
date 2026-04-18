import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
  const url = process.env.DATABASE_URL ?? "./data/open-health.db";
  const sqlite = new Database(url);
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: join(__dirname, "migrations") });
  sqlite.close();
  console.log("Migrations aplicadas.");
}
