import type { Metadata, Viewport } from "next";
import { DM_Mono, Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { CLINIC } from "@/lib/content";
import { structuredData } from "@/lib/seo";
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

const TITLE =
  "Dr Akshi Bansal | Dermatologist, Dermatosurgeon & Trichologist in Bengaluru | The Skin Edit";
const DESCRIPTION =
  "Dr Akshi Bansal is a senior dermatologist, dermatosurgeon and trichologist in Bengaluru, offering clinical dermatology, hair and scalp care, dermatosurgery and aesthetic dermatology.";
const OG_IMAGE = `${SITE_URL}${CLINIC.doctor.photo}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  applicationName: CLINIC.brand,
  authors: [{ name: CLINIC.doctor.name }],
  creator: CLINIC.doctor.name,
  publisher: CLINIC.brand,
  category: "Dermatology",
  keywords: [
    "dermatologist in Bengaluru",
    "dermatologist in Bangalore",
    "senior dermatologist in Bengaluru",
    "dermatosurgeon in Bengaluru",
    "trichologist in Bengaluru",
    "hair loss treatment",
    "hair and scalp care",
    "clinical dermatology",
    "aesthetic dermatology",
    "acne treatment",
    "pigmentation treatment",
    "melasma treatment",
    "hair transplantation",
    "laser dermatology",
    "dermatosurgery",
    "Dr Akshi Bansal",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: CLINIC.brand,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 646,
        height: 703,
        alt: CLINIC.doctor.photoAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfaf6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${jakarta.variable} ${dmMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(SITE_URL)) }}
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
