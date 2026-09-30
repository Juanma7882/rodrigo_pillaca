import { buildRobots } from '~/features/seo';
import { siteUrl } from '~/shared/site.server';

export function loader() {
  return new Response(buildRobots(siteUrl()), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
