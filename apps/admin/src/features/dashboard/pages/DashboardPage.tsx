import { useSessionStore } from '@/features/auth';

export function DashboardPage() {
  const admin = useSessionStore((state) => state.admin);
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-3xl font-black tracking-tight uppercase">Panel</h1>
      <p className="text-muted-foreground">
        Hola{admin ? `, ${admin.email}` : ''}. Pronto vas a poder editar desde acá los textos y las
        imágenes del sitio.
      </p>
    </section>
  );
}
