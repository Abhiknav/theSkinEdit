import { subscribe, type RealtimeEvent } from "@/server/realtime/bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream of calendar changes.
 * The booking calendar subscribes here so a slot taken by someone else
 * disappears live, without a refresh.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream already closed by the client.
        }
      };

      send({ type: "ping", at: new Date().toISOString() });
      const unsubscribe = subscribe(send);
      // Keeps proxies from closing an idle connection.
      const heartbeat = setInterval(() => send({ type: "ping", at: new Date().toISOString() }), 25000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
