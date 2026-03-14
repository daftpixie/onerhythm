import type { MetadataRoute } from "next";

import { contentEntries } from "../content/entries";
import { absoluteUrl } from "../lib/site";

const staticRoutes = [
  "/",
  "/about",
  "/mission",
  "/community",
  "/community/stories",
  "/learn",
  "/research",
  "/evidence",
  "/stories",
  "/campaigns",
  "/support",
  "/conditions",
] as const;

const kindBasePath = {
  essay: "/stories",
  research_translation: "/research",
  condition_module: "/conditions",
  support_resource: "/support",
  campaign_page: "/campaigns",
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const contentEntriesInSitemap: MetadataRoute.Sitemap = contentEntries
    .filter((entry) => entry.review_state === "published")
    .map((entry) => ({
      url: absoluteUrl(`${kindBasePath[entry.kind]}/${entry.slug}`),
      lastModified: entry.updated_date ?? entry.publish_date,
      changeFrequency: entry.educational_surface ? "monthly" : "weekly",
      priority: entry.kind === "campaign_page" || entry.kind === "essay" ? 0.9 : 0.8,
    }));

  return [...staticEntries, ...contentEntriesInSitemap];
}
