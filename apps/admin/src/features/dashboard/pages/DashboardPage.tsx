import { useSessionStore } from '@/features/auth';
import { getSiteUrl, PageHeader } from '@/features/content';
import { useUnusedMediaCount } from '@/features/media';
import { useProjects } from '@/features/projects';
import { useServices } from '@/features/services';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@tamila/ui';
import {
  CircleHelp,
  ExternalLink,
  Hammer,
  Images,
  ListOrdered,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function DashboardPage() {
  const admin = useSessionStore((state) => state.admin);
  const services = useServices();
  const projects = useProjects();
  const unusedMedia = useUnusedMediaCount();
  const siteUrl = getSiteUrl();

  const publishedServices = services.data?.filter((s) => s.published).length;
  const publishedProjects = projects.data?.filter((p) => p.published).length;

  return (
    <>
      <PageHeader
        title="Panel"
        description={`Hola${admin ? `, ${admin.email}` : ''}. Desde acá editás los textos y las fotos del sitio.`}
        actions={
          siteUrl && (
            <Button asChild variant="outline" className="min-h-11">
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden /> Ver el sitio
              </a>
            </Button>
          )
        }
      />
      <ul aria-label="Secciones del panel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard to="/servicios" icon={Wrench} title="Servicios">
          <Summary
            loading={services.isPending}
            text={`${publishedServices} de ${services.data?.length} publicados`}
          />
        </SectionCard>
        <SectionCard to="/trabajos" icon={Hammer} title="Trabajos">
          <Summary
            loading={projects.isPending}
            text={publishedProjects === 1 ? '1 publicado' : `${publishedProjects} publicados`}
          />
        </SectionCard>
        <SectionCard to="/imagenes" icon={Images} title="Imágenes">
          <Summary
            loading={unusedMedia.isPending}
            text={unusedMedia.data === 1 ? '1 sin usar' : `${unusedMedia.data} sin usar`}
          />
        </SectionCard>
        <SectionCard to="/configuracion" icon={Settings} title="Configuración">
          Portada, WhatsApp, redes y buscadores
        </SectionCard>
        <SectionCard to="/como-trabajamos" icon={ListOrdered} title="Cómo trabajamos">
          Los pasos del proceso
        </SectionCard>
        <SectionCard to="/preguntas" icon={CircleHelp} title="Preguntas frecuentes">
          Preguntas y respuestas del inicio
        </SectionCard>
      </ul>
    </>
  );
}

function SectionCard({
  to,
  icon: Icon,
  title,
  children,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Card className="h-full transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon aria-hidden className="size-5 text-brand-text" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
        </Card>
      </Link>
    </li>
  );
}

function Summary({ loading, text }: { loading: boolean; text: string }) {
  return loading ? <Skeleton className="h-4 w-24" /> : <>{text}</>;
}
