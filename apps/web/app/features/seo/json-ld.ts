import type { ServiceDetail, SiteContent } from '@tamila/shared';
import { absoluteUrl } from './meta';

/** Negocio local de construcción con su catálogo de servicios publicados. */
export function businessJsonLd(site: SiteContent, siteUrl: string) {
  const { settings } = site;
  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': absoluteUrl(siteUrl, '/#negocio'),
    name: 'TAMILA',
    url: absoluteUrl(siteUrl, '/'),
    logo: absoluteUrl(siteUrl, '/favicon.svg'),
    description: settings.seoDescription,
    ...(settings.ogImage ? { image: absoluteUrl(siteUrl, settings.ogImage.src) } : {}),
    ...(settings.whatsappNumber ? { telephone: `+${settings.whatsappNumber}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios',
      itemListElement: site.services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
          url: absoluteUrl(siteUrl, `/servicios/${service.slug}`),
        },
      })),
    },
  };
}

export function serviceJsonLd(service: ServiceDetail, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    serviceType: service.name,
    description: service.seoDescription,
    url: absoluteUrl(siteUrl, `/servicios/${service.slug}`),
    ...(service.coverImage ? { image: absoluteUrl(siteUrl, service.coverImage.src) } : {}),
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      '@id': absoluteUrl(siteUrl, '/#negocio'),
      name: 'TAMILA',
    },
  };
}
