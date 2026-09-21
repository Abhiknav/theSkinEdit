#!/usr/bin/env node
/**
 * Applies the schema to the database in DATABASE_URL.
 *
 * Optional: the app applies the same statements itself the first time it
 * connects, so a normal deployment never needs this. It exists for applying a
 * migration ahead of a deploy, or checking a connection string works.
 *
 *   DATABASE_URL="postgresql://..." npm run db:setup
 */
import process from "node:process";

import { SCHEMA_SQL } from "../src/server/db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. The app runs on the file store until it is.");
  process.exit(1);
}

const { default: pg } = await import("pg");
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(SCHEMA_SQL);
  console.log("Schema applied.");
} finally {
  await client.end();
}
