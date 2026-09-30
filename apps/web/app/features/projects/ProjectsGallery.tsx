import type { Project } from '@tamila/shared';
import { Eyebrow, ResponsiveImage } from '@tamila/ui';
import { lazy, Suspense } from 'react';
import { SectionHeader, useInView } from '~/shared/ui';

// El comparador se descarga recién cuando la sección está por entrar en pantalla.
const BeforeAfter = lazy(() => import('./BeforeAfter').then((m) => ({ default: m.BeforeAfter })));

function ProjectMedia({ project, load }: { project: Project; load: boolean }) {
  const { beforeImage, afterImage } = project;
  const still = afterImage ?? project.images[0] ?? beforeImage;
  const fallback = still ? (
    <ResponsiveImage
      image={still}
      sizes="(min-width: 768px) 45vw, 100vw"
      className="group aspect-[4/3]"
    />
  ) : null;

  if (beforeImage && afterImage && load) {
    return (
      <Suspense fallback={fallback}>
        <BeforeAfter before={beforeImage} after={afterImage} title={project.title} />
      </Suspense>
    );
  }
  return fallback;
}

/** Trabajos realizados. Sin trabajos publicados la sección no se muestra. */
export function ProjectsGallery({ projects }: { projects: Project[] }) {
  const { ref, inView } = useInView<HTMLElement>();
  if (projects.length === 0) return null;

  return (
    <section
      ref={ref}
      id="trabajos"
      aria-labelledby="trabajos-titulo"
      className="scroll-mt-16 border-t"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <SectionHeader folio="Portfolio" title="Trabajos realizados" id="trabajos-titulo" />
        <ul className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id} className="flex flex-col gap-4">
              <ProjectMedia project={project} load={inView} />
              <Eyebrow>
                {[project.service.name, project.year, project.location].filter(Boolean).join(' · ')}
              </Eyebrow>
              <h3 className="text-xl font-extrabold uppercase">{project.title}</h3>
              <p className="text-muted-foreground">{project.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
