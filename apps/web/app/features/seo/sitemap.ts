import { absoluteUrl } from './meta';

/** sitemap.xml con el inicio y las páginas de los servicios publicados. */
export function buildSitemap(siteUrl: string, serviceSlugs: string[]): string {
  const urls = ['/', ...serviceSlugs.map((slug) => `/servicios/${slug}`)];
  const entries = urls
    .map((path) => `  <url><loc>${absoluteUrl(siteUrl, path)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function buildRobots(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}\n`;
}
