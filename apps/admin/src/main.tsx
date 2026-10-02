import { ThemeProvider, Toaster } from '@tamila/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createRouter } from './app/router';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
const router = createRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors={false} closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
