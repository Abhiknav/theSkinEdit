import { getPrimaryDoctor, getStore } from "@/server/db";
import { fail, ok } from "@/server/http";
import { runDueNotifications } from "@/server/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Drains due notification jobs (reminders, feedback requests).
 * Point a scheduler at this every 15 minutes — Vercel Cron, or any cron that
 * can send a header. See vercel.json.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const store = await getStore();
    const doctor = await getPrimaryDoctor();
    const results = await runDueNotifications(store, doctor, 50);
    return ok({ processed: results.length, results });
  } catch (error) {
    return fail(error);
  }
}
