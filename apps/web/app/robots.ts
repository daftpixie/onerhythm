import type { MetadataRoute } from "next";

import { absoluteUrl } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/mission", "/community", "/learn", "/research", "/evidence", "/stories", "/campaigns", "/support", "/conditions"],
      disallow: ["/account", "/education", "/onboarding", "/sign-in", "/sign-up"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
