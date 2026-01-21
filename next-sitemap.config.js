/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.supplr.net",
  generateRobotsTxt: true,
  generateIndexSitemap: false, // Set to true if you have more than 50,000 URLs

  // Exclude paths that shouldn't be indexed
  exclude: [
    "/dashboard*",
    "/sign-in*",
    "/sign-up*",
    "/api/*",
    "/invite/*",
    "/team*",
    "/billing*",
    "/settings*",
    "/inventory*",
    "/reports*",
    "/import*",
    "/loading-demo*",
    "/slow-page*",
    "/css-test*",
  ],

  // Additional paths to include (if you have dynamic routes you want indexed)
  additionalPaths: async (config) => [
    // Add any dynamic paths you want to include
    // Example: await config.transform(config, '/use-cases/medical-spas'),
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/sign-in/",
          "/sign-up/",
          "/api/",
          "/invite/",
          "/team/",
          "/billing/",
          "/settings/",
          "/inventory/",
          "/reports/",
          "/import/",
          "/*?*", // Disallow URLs with query parameters
        ],
      },
    ],
    additionalSitemaps: ["https://www.supplr.net/sitemap.xml"],
  },

  transform: async (config, path) => {
    // Custom transform function to modify sitemap entries
    return {
      loc: path, // The URL
      changefreq: getChangeFreq(path),
      priority: getPriority(path),
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};

function getChangeFreq(path) {
  // Set change frequency based on path
  if (path === "/") return "daily";
  if (path.startsWith("/blog")) return "weekly";
  if (path.startsWith("/pricing")) return "monthly";
  if (path.startsWith("/use-cases")) return "monthly";
  return "weekly";
}

function getPriority(path) {
  // Set priority based on path importance
  if (path === "/") return 1.0;
  if (path === "/pricing") return 0.9;
  if (path.startsWith("/use-cases")) return 0.8;
  if (path === "/support") return 0.7;
  if (path.startsWith("/blog")) return 0.6;
  return 0.5;
}
