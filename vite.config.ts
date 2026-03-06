import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    const configuredProxyTarget =
      (process.env.VITE_DEV_PROXY_TARGET || process.env.VITE_API_URL || 'http://127.0.0.1:3001')
        .replace(/\/+$/, '')
        .replace(/\/api$/, '');

    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: configuredProxyTarget,
            changeOrigin: true,
          },
          '/health': {
            target: configuredProxyTarget,
            changeOrigin: true,
          },
          '/uploads': {
            target: configuredProxyTarget,
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
