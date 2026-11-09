import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * The landing shares the app's origin: nginx serves it at `/` to visitors without a session and
 * the app everywhere else. Its own files live under `/_landing/`, apart from the app's `/assets/`.
 */
const SITE_URL = process.env.SITE_URL ?? 'https://demo-workus.osdb.io';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: { assets: '_landing', format: 'file' },
  compressHTML: true,
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
