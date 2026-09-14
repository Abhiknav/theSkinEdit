"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, Notice, SubmitButton } from "@/components/site/Field";

export function LoginForm({ devHint }: { devHint: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not sign in.");
      router.replace("/doctor/appointments");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-9 p-9">
      <div>
        <div className="label">Practice dashboard</div>
        <h1 className="mt-4 font-display text-3xl text-ink">Welcome back, Dr Bansal.</h1>
        <p className="mt-3 text-sm leading-relaxed text-soft">
          Your calendar, your appointments and your feedback inbox.
        </p>
      </div>

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="username"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />

      {error && <Notice>{error}</Notice>}

      <SubmitButton busy={busy} className="w-full">
        Sign in
      </SubmitButton>

      {devHint && (
        <p className="border border-border bg-tint px-4 py-3 text-xs leading-relaxed text-faint">
          Development sign-in: <span className="text-copper">akshi@theskinedit.in</span> /{" "}
          <span className="text-copper">skinedit</span>. Set DOCTOR_EMAIL, DOCTOR_PASSWORD and AUTH_SECRET before
          deploying — and swap this screen for Clerk or Supabase Auth when a second doctor joins.
        </p>
      )}
    </form>
  );
}
