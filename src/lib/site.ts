/**
 * The canonical public URL of the site.
 *
 * Resolved in order, so a deployment works with no configuration at all:
 *
 *  1. NEXT_PUBLIC_SITE_URL          — explicit override, always wins
 *  2. VERCEL_PROJECT_PRODUCTION_URL — set by Vercel on every deployment. Holds the
 *                                     shortest production domain, so it becomes the
 *                                     custom domain automatically once one is added.
 *  3. VERCEL_URL                    — this specific deployment (preview builds)
 *  4. localhost                     — development
 *
 * Vercel supplies its variables without a scheme, hence the normalising below.
 */
function normalise(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function siteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const url = normalise(candidate);
    if (url) return url;
  }

  return "http://localhost:3000";
}
