import "server-only";

import { FileStore } from "./file-driver";
import { DOCTOR_SLUG } from "./seed";
import type { Store } from "./types";

declare global {
  // Survives Next.js dev hot-reloads so the file store keeps one mutex chain.
  var __skinEditStore: Promise<Store> | undefined;
}

async function create(): Promise<Store> {
  const url = process.env.DATABASE_URL;
  if (url) {
    // Imported lazily so the `pg` driver never enters the bundle in file mode.
    const { PostgresStore } = await import("./pg-driver");
    const store = new PostgresStore(url);
    await store.init();
    return store;
  }
  const store = new FileStore();
  await store.init();
  return store;
}

export function getStore(): Promise<Store> {
  if (!globalThis.__skinEditStore) globalThis.__skinEditStore = create();
  return globalThis.__skinEditStore;
}

/** Resolves the single clinic doctor. Swap for a slug/param lookup when partners join. */
export async function getPrimaryDoctor() {
  const store = await getStore();
  const doctor = await store.getDoctor(DOCTOR_SLUG);
  if (!doctor) throw new Error("Primary doctor row missing — store was not seeded.");
  return doctor;
}

export { DOCTOR_SLUG } from "./seed";
export type * from "./types";
