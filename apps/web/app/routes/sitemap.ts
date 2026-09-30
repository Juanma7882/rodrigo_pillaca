import { buildSitemap } from '~/features/seo';
import { getServices } from '~/shared/api/client.server';
import { siteUrl } from '~/shared/site.server';

/** Se arma en cada request (con caché de 1 h): un servicio publicado aparece sin redesplegar. */
export async function loader() {
  const services = await getServices();
  return new Response(
    buildSitemap(
      siteUrl(),
      services.map((s) => s.slug),
    ),
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
