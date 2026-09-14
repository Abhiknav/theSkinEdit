import "server-only";

/**
 * Live calendar updates.
 *
 * MVP: an in-process pub/sub fanned out to browsers over Server-Sent Events.
 * That is correct for a single instance, which is all a one-doctor clinic needs.
 *
 * [SCALE] On multiple instances this must become a shared channel — Supabase
 * Realtime (subscribe to postgres_changes on `slots`) or Redis pub/sub feeding
 * the same SSE route. The client hook stays unchanged either way.
 */

export type RealtimeEvent =
  | { type: "slots:changed"; doctorId: string; slotIds: string[]; at: string }
  | { type: "ping"; at: string };

type Listener = (event: RealtimeEvent) => void;

declare global {
  var __skinEditListeners: Set<Listener> | undefined;
}

function listeners(): Set<Listener> {
  if (!globalThis.__skinEditListeners) globalThis.__skinEditListeners = new Set();
  return globalThis.__skinEditListeners;
}

export function subscribe(listener: Listener): () => void {
  listeners().add(listener);
  return () => listeners().delete(listener);
}

export function publish(event: RealtimeEvent): void {
  for (const listener of listeners()) {
    try {
      listener(event);
    } catch {
      // A dead SSE connection must never break the request that triggered it.
    }
  }
}

export function publishSlotChange(doctorId: string, slotIds: string[]): void {
  publish({ type: "slots:changed", doctorId, slotIds, at: new Date().toISOString() });
}
