import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tamilaThemeScript } from '@tamila/ui/vite-plugin';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_INTERNAL_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss(), tamilaThemeScript()],
  // Las variables VITE_* se leen del .env de la raíz del monorepo.
  envDir: '../..',
  resolve: { tsconfigPaths: true },
  server: {
    host: true,
    port: Number(process.env.ADMIN_PORT ?? 4174),
    strictPort: true,
    // Hosts de la red de Docker (capturas y tests desde otros contenedores).
    allowedHosts: ['localhost', 'web', 'admin', 'host.docker.internal'],
    proxy: { '/api': apiTarget, '/media': apiTarget },
  },
});
