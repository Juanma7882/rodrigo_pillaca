import { useLoaderData, useRouteLoaderData } from 'react-router';
import { HomePage } from '~/features/home';
import { buildMeta, businessJsonLd } from '~/features/seo';
import { getProjects, getServices } from '~/shared/api/client.server';
import type { loader as rootLoader } from '~/root';
import type { Route } from './+types/home';

export async function loader() {
  const [services, projects] = await Promise.all([getServices(), getProjects()]);
  return { services, projects };
}

export function meta({ matches }: Route.MetaArgs) {
  const root = matches.find((m) => m?.id === 'root')?.loaderData as
    Awaited<ReturnType<typeof rootLoader>> | undefined;
  if (!root) return [{ title: 'TAMILA' }];
  const { settings } = root.site;
  return buildMeta({
    title: settings.seoTitle,
    description: settings.seoDescription,
    path: '/',
    siteUrl: root.siteUrl,
    image: settings.ogImage,
    jsonLd: businessJsonLd(root.site, root.siteUrl),
  });
}

export default function Home() {
  const { services, projects } = useLoaderData<typeof loader>();
  const root = useRouteLoaderData<typeof rootLoader>('root');
  if (!root) return null;
  return <HomePage site={root.site} services={services} projects={projects} />;
}

export { RouteErrorBoundary as ErrorBoundary } from '~/shared/ui';
