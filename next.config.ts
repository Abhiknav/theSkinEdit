import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The site is a single page with anchored sections. These keep the old paths
   * (and any link already sent out by email) landing in the right place.
   * Query strings are preserved, so /my-bookings?ref=SE-XXXX still works.
   */
  async redirects() {
    const map: Record<string, string> = {
      "/about": "/#about",
      "/services": "/#treatments",
      "/treatments": "/#treatments",
      "/gallery": "/#about",
      "/book": "/#book",
      "/my-bookings": "/#manage",
      "/testimonials": "/#voices",
      "/faq": "/#faq",
      "/contact": "/#contact",
    };
    return Object.entries(map).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
