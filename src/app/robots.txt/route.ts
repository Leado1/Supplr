export async function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Block authenticated areas
Disallow: /dashboard/
Disallow: /sign-in/
Disallow: /sign-up/
Disallow: /api/
Disallow: /invite/
Disallow: /team/
Disallow: /billing/
Disallow: /settings/
Disallow: /inventory/
Disallow: /reports/
Disallow: /import/

# Block test and demo pages
Disallow: /loading-demo/
Disallow: /slow-page/
Disallow: /css-test/

# Block URLs with query parameters
Disallow: /*?*

# Allow well-known paths
Allow: /.well-known/

# Sitemap location
Sitemap: https://www.supplr.net/sitemap.xml

# Crawl delay (optional - be respectful)
Crawl-delay: 1
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, must-revalidate', // Cache for 1 day
    },
  });
}