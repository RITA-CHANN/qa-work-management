import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  // Read the shared repo-root .env; shell variables (e.g. from Playwright) win.
  const env = { ...loadEnv(mode, repoRoot, ''), ...process.env };
  const apiPort = env.API_PORT ?? '3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: Number(env.WEB_PORT ?? 5173),
      strictPort: true,
      // Same-origin API calls: the browser talks to Vite, Vite forwards /api to Express.
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  };
});
