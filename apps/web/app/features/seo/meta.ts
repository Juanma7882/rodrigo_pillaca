import type { MediaAsset } from '@tamila/shared';
import type { MetaDescriptor } from 'react-router';

type MetaInput = {
  title: string;
  description: string;
  /** Ruta de la página (ej. "/servicios/durlock"). */
  path: string;
  siteUrl: string;
  image?: MediaAsset | null;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
};

export const absoluteUrl = (siteUrl: string, path: string) => new URL(path, siteUrl).toString();

/** Título, descripción, canonical, Open Graph, Twitter y datos estructurados de una página. */
export function buildMeta({
  title,
  description,
  path,
  siteUrl,
  image,
  type = 'website',
  jsonLd,
}: MetaInput): MetaDescriptor[] {
  const url = absoluteUrl(siteUrl, path);
  const imageUrl = image ? absoluteUrl(siteUrl, image.src) : null;
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'TAMILA' },
    { property: 'og:locale', content: 'es_AR' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    ...(imageUrl
      ? [
          { property: 'og:image', content: imageUrl },
          { property: 'og:image:width', content: String(image!.width) },
          { property: 'og:image:height', content: String(image!.height) },
          { property: 'og:image:alt', content: image!.alt },
        ]
      : []),
    { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' },
    ...(jsonLd ? [{ 'script:ld+json': jsonLd }] : []),
  ];
}
