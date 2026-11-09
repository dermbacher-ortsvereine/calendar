import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Logo-Uploads laufen über Server Actions (Bucket-Limit 2 MB).
    serverActions: { bodySizeLimit: "3mb" },
  },
  cacheLife: {
    // Öffentliche Kalenderdaten: kurz cachen; nach Änderungen sofort per Tag neu laden.
    kalender: { stale: 60, revalidate: 300, expire: 86400 },
    // Statische öffentliche Seiten (Startseite, Termin-Detail): Änderungen kommen sofort per Cache-Tag;
    // "heute" korrigiert der Browser. Neu erzeugt wird nur beim ersten Aufruf nach Ablauf – ohne Besucher
    // entsteht keine Rechenzeit.
    seiten: { stale: 60, revalidate: 3600, expire: 86400 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
