"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AvailabilityData, ConsultMode } from "./types";

/**
 * Live availability.
 *
 * Fetches the materialised calendar, then keeps it honest by listening to the
 * SSE stream — when anyone books, blocks or cancels, every open calendar
 * re-reads within a moment. `liveTick` increments on each live update so the UI
 * can acknowledge it visually.
 */
export function useAvailability(mode?: ConsultMode) {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveTick, setLiveTick] = useState(0);
  const [connected, setConnected] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(
    async (quiet = false) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (!quiet) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (mode) params.set("mode", mode);
        const response = await fetch(`/api/slots?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load the calendar.");
        setData((await response.json()) as AvailabilityData);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load the calendar.");
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [mode],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const source = new EventSource("/api/realtime");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string };
        if (payload.type === "slots:changed") {
          setLiveTick((tick) => tick + 1);
          void load(true);
        }
      } catch {
        // Ignore malformed frames.
      }
    };
    return () => source.close();
  }, [load]);

  return { data, loading, error, reload: load, liveTick, connected };
}
