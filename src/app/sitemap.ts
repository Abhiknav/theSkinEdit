import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * One indexable page. The anchored sections are not separate URLs, so they are
 * deliberately absent — listing them would only create duplicates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl()}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
