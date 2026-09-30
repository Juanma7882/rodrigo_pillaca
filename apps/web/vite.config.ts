import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_INTERNAL_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  // Las variables VITE_* se leen del .env de la raíz del monorepo.
  envDir: '../..',
  resolve: { tsconfigPaths: true },
  server: {
    host: true,
    port: Number(process.env.WEB_PORT ?? 4173),
    strictPort: true,
    // Hosts de la red de Docker (capturas y tests desde otros contenedores).
    allowedHosts: ['localhost', 'web', 'admin', 'host.docker.internal'],
    proxy: { '/api': apiTarget, '/media': apiTarget },
  },
});
