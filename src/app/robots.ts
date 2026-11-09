import type { MetadataRoute } from "next";

/**
 * Suchmaschinen sollen nur die eigentlichen Seiten erfassen. Kalender-Varianten mit
 * Query-String (?m=, ?v=, ?termin= …) ergeben unzählige URLs mit demselben Inhalt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*?", "/api/", "/verwaltung", "/admin", "/login"],
    },
  };
}
