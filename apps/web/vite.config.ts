import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_INTERNAL_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
  server: {
    host: true,
    port: Number(process.env.WEB_PORT ?? 4173),
    strictPort: true,
    proxy: { '/api': apiTarget },
  },
});
