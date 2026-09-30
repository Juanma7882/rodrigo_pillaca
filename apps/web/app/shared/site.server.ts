/** URL pública del sitio (canonical, Open Graph, sitemap). Solo se lee en el servidor. */
export const siteUrl = () => process.env.PUBLIC_SITE_URL ?? 'http://localhost:4173';
