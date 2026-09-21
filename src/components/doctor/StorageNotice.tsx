import type { StorageHealth } from "@/server/booking/admin";

/**
 * Shown only to the doctor, and only when the store cannot be trusted. A
 * missing DATABASE_URL on a serverless host loses bookings between instances
 * without any error anywhere — this is the one place that says so.
 */
export function StorageNotice({ health }: { health: StorageHealth }) {
  if (health.durable) return null;

  return (
    <div
      role="alert"
      className={`mb-10 rounded-2xl border p-6 ${
        health.ephemeral ? "border-copper bg-copper-wash" : "border-border bg-tint"
      }`}
    >
      <p className="font-display text-[1.2rem] text-ink">
        {health.ephemeral
          ? "Appointments are not being saved reliably."
          : "Running on local file storage."}
      </p>
      <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-soft">
        {health.ephemeral ? (
          <>
            No <code className="font-mono text-[0.84rem]">DATABASE_URL</code> is set, so this
            deployment is writing to a temporary folder that each server instance keeps to itself
            and clears when it restarts. A booking taken a moment ago may not appear here at all.
            Add a Postgres connection string and run{" "}
            <code className="font-mono text-[0.84rem]">npm run db:setup</code> — DEPLOY.md has the
            steps.
          </>
        ) : (
          <>
            Bookings are stored in a file on this machine, which is fine for development. Set{" "}
            <code className="font-mono text-[0.84rem]">DATABASE_URL</code> before taking real
            patients.
          </>
        )}
      </p>
    </div>
  );
}
