import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ohmyats.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/scan", changefreq: "weekly", priority: "0.9" },
  { path: "/cover-letter", changefreq: "weekly", priority: "0.8" },
  { path: "/interview", changefreq: "weekly", priority: "0.8" },
  { path: "/interview-qa", changefreq: "weekly", priority: "0.8" },
  { path: "/versions", changefreq: "weekly", priority: "0.8" },
  { path: "/jd-optimizer", changefreq: "weekly", priority: "0.8" },
  { path: "/keywords", changefreq: "weekly", priority: "0.8" },
  { path: "/cold-outreach", changefreq: "weekly", priority: "0.8" },
  { path: "/linkedin", changefreq: "weekly", priority: "0.8" },
  { path: "/tracker", changefreq: "weekly", priority: "0.8" },
  { path: "/contacts", changefreq: "weekly", priority: "0.8" },
  { path: "/notes", changefreq: "weekly", priority: "0.8" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.8" },
  { path: "/elevator-pitch", changefreq: "weekly", priority: "0.8" },
  { path: "/profile", changefreq: "weekly", priority: "0.7" },
  { path: "/support", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "weekly", priority: "0.7" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/data-processing", changefreq: "monthly", priority: "0.5" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
