"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { ConsentCheckbox, Field, Notice, SubmitButton, TextArea } from "@/components/site/Field";

export function FeedbackForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("");
  const [comment, setComment] = useState("");
  const [reference, setReference] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Feedback-request emails land with ?ref= in the URL.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReference(ref.toUpperCase());
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, patientName, comment, reference: reference || null, consent }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not send that.");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-9 text-center"
        >
          <span className="font-display text-[3rem] leading-none text-copper italic">se</span>
          <h3 className="mt-4 font-display text-[1.8rem] text-ink">Thank you.</h3>
          <p className="mx-auto mt-3 max-w-sm text-[0.92rem] leading-relaxed text-soft">
            Your note has gone to Dr Bansal. Nothing is published until she reads and approves it.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card space-y-6 p-7 sm:p-8"
        >
          <div>
            <span className="label">Leave a note</span>
            <div className="mt-4 flex gap-2.5" onMouseLeave={() => setHover(null)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} of 5`}
                  onMouseEnter={() => setHover(value)}
                  onClick={() => setRating(value)}
                  className="text-[1.6rem] leading-none transition-transform duration-300 hover:scale-110"
                >
                  <span className={value <= (hover ?? rating) ? "text-copper" : "text-border"}>✦</span>
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Your name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            autoComplete="name"
            required
          />

          <TextArea
            label="Your note"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
            hint="About your experience — no medical details, please."
          />

          <Field
            label="Booking reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
          />

          <ConsentCheckbox checked={consent} onChange={setConsent}>
            Dr Bansal may read this and publish it on the site, with or without my name, at her
            discretion.
          </ConsentCheckbox>

          {error && <Notice>{error}</Notice>}

          <SubmitButton busy={busy} disabled={!consent}>
            Send note
          </SubmitButton>
        </motion.form>
    )
  );
}
