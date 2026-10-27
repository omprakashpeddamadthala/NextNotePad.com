import type { MetadataRoute } from "next";
import { SITE_PAGES, absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const newestReview = SITE_PAGES.map((p) => p.lastReviewed)
    .sort()
    .at(-1);
  return [
    {
      url: absoluteUrl("/"),
      lastModified: newestReview,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...SITE_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.lastReviewed,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ];
}
