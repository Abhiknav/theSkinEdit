#!/usr/bin/env node
/**
 * Applies src/server/db/schema.sql to the database in DATABASE_URL.
 * Idempotent — every statement is CREATE ... IF NOT EXISTS.
 *
 *   npm run db:setup
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. The app runs on the file store until it is.");
  process.exit(1);
}

const { default: pg } = await import("pg");
const sql = await readFile(path.join(process.cwd(), "src/server/db/schema.sql"), "utf8");

const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied.");
} finally {
  await client.end();
}
