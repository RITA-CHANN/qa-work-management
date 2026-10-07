import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from '@/app/router';
import { loginPathFor } from '@/features/auth/return-to';
import { setUnauthenticatedHandler } from '@/lib/api-client';
import './index.css';

const queryClient = new QueryClient();

// A 401 from any data call means the session ended: forget everything and go to /login (FLW-AUTH-02).
setUnauthenticatedHandler(() => {
  const { pathname, search } = router.state.location;
  queryClient.clear();
  void router.navigate(loginPathFor(pathname + search), { replace: true });
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
