import { logout, RequireAuth } from '@/features/auth';
import { Button, ThemeToggle } from '@tamila/ui';
import { LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router';

export function AdminLayout() {
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <span className="font-black tracking-[0.2em] uppercase">
              TAMILA <span className="text-brand-text">admin</span>
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button type="button" variant="outline" size="sm" onClick={onLogout}>
                <LogOut aria-hidden /> Cerrar sesión
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
}
