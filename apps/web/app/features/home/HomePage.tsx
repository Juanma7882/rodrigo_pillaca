import type { Project, ServiceChapter as ServiceChapterData, SiteContent } from '@tamila/shared';
import { FaqAccordion } from '~/features/faq';
import { Hero } from '~/features/hero';
import { ProcessSteps } from '~/features/process';
import { ProjectsGallery } from '~/features/projects';
import { ServiceChapter, ServicesIndex } from '~/features/services';

type HomePageProps = { site: SiteContent; services: ServiceChapterData[]; projects: Project[] };

export function HomePage({ site, services, projects }: HomePageProps) {
  return (
    <>
      <Hero settings={site.settings} />
      {services.length > 0 && <ServicesIndex services={services} />}
      {services.map((service) => (
        <ServiceChapter
          key={service.slug}
          service={service}
          whatsappNumber={site.settings.whatsappNumber}
        />
      ))}
      <ProcessSteps steps={site.processSteps} />
      <ProjectsGallery projects={projects} />
      <FaqAccordion faqs={site.faqs} />
    </>
  );
}
