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
  build: {
    rolldownOptions: {
      output: {
        // The core libraries every page needs, in named chunks that change rarely, so browsers
        // keep them across deploys. MUI stays split per component (only what a page uses).
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'mui-core',
              test: /node_modules[\\/](@mui[\\/](system|utils|styled-engine|private-theming)|@emotion)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/](react-router|@tanstack|axios|zod|i18next|react-i18next|tailwind-merge|clsx)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Same origin in development: the session and XSRF cookies belong to the dev server host.
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
  },
}));
