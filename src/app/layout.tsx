import type { Metadata, Viewport } from "next";
import { DM_Mono, Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { CLINIC } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "The Skin Edit — Dr Akshi Bansal, Dermatologist in Bengaluru",
  description:
    "Dr Akshi Bansal — dermatologist, dermatosurgeon and trichologist in Bengaluru. Acne, pigmentation, hair loss, lasers and aesthetic medicine. See live availability and book in under a minute.",
  keywords: [
    "dermatologist Bangalore",
    "skin specialist Sarjapur",
    "Dr Akshi Bansal",
    "acne treatment Bangalore",
    "hair loss treatment Bengaluru",
    "melasma pigmentation dermatologist",
  ],
  openGraph: {
    title: "The Skin Edit — Dr Akshi Bansal",
    description:
      "Dermatology, trichology and aesthetic medicine in Bengaluru. Live appointment booking — reschedule or cancel yourself.",
    url: SITE_URL,
    siteName: CLINIC.brand,
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fdfaf6",
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: CLINIC.brand,
  url: SITE_URL,
  telephone: CLINIC.phone,
  medicalSpecialty: "Dermatology",
  areaServed: "Bengaluru",
  employee: {
    "@type": "Physician",
    name: CLINIC.doctor.name,
    medicalSpecialty: "Dermatology",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Thursday", "Saturday"],
      opens: "13:30",
      closes: "17:30",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday"], opens: "17:00", closes: "20:00" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${jakarta.variable} ${dmMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Reveal animations begin at opacity 0, written inline during SSR.
            Without JS nothing would undo them, so the copy is restored here. */}
        <noscript>
          <style>{`.rv{opacity:1!important;animation:none!important}.split .w>span{transform:none!important}[style*="opacity"],[style*="transform"]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-deep focus:px-5 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
