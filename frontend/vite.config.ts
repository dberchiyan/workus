import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    command === 'serve' &&
      checker({ typescript: { buildMode: true, tsconfigPath: 'tsconfig.app.json' } }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Same origin in development: the session and XSRF cookies belong to the dev server host.
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
  },
}));
