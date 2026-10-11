import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // The API serves this app under /users/ (apis/api-mono/api/src/services/FrontendAssetsService.ts)
    base: env.VITE_BASE_PATH || '/users/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3004,
      host: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
    },
  };
});
