import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

const API_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
const apiProxy = { '/api': { target: API_TARGET, changeOrigin: false } };

export default defineConfig(({ command }) => ({
    plugins: [
        react(),
        tailwindcss(),
        command === 'serve' && checker({ typescript: { buildMode: true, tsconfigPath: 'tsconfig.app.json' } }),
    ],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
        rolldownOptions: {
            output: {
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
        proxy: apiProxy,
    },
    preview: {
        proxy: apiProxy,
    },
}));
