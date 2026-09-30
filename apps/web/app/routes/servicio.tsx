import { useLoaderData, useRouteLoaderData } from 'react-router';
import { ProjectsGallery } from '~/features/projects';
import { buildMeta, serviceJsonLd } from '~/features/seo';
import { ServiceChapter, ServicePager } from '~/features/services';
import { getService } from '~/shared/api/client.server';
import type { loader as rootLoader } from '~/root';
import type { Route } from './+types/servicio';

export async function loader({ params }: Route.LoaderArgs) {
  return { service: await getService(params.slug) };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const root = matches.find((m) => m?.id === 'root')?.loaderData as
    Awaited<ReturnType<typeof rootLoader>> | undefined;
  if (!loaderData || !root) return [{ title: 'Servicio no encontrado · TAMILA' }];
  const { service } = loaderData;
  return buildMeta({
    title: service.seoTitle,
    description: service.seoDescription,
    path: `/servicios/${service.slug}`,
    siteUrl: root.siteUrl,
    image: service.coverImage ?? root.site.settings.ogImage,
    type: 'article',
    jsonLd: serviceJsonLd(service, root.siteUrl),
  });
}

export default function ServicioPage() {
  const { service } = useLoaderData<typeof loader>();
  const root = useRouteLoaderData<typeof rootLoader>('root');
  return (
    <>
      <ServiceChapter
        service={service}
        whatsappNumber={root?.site.settings.whatsappNumber ?? ''}
        standalone
      />
      <ProjectsGallery projects={service.projects} />
      <ServicePager previous={service.previous} next={service.next} />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary } from '~/shared/ui';
