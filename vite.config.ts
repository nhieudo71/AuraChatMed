import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';

dotenv.config();
import { VitePWA } from 'vite-plugin-pwa';
import { handleChatStream, handleTranscribeAudio, handleFetchModels, handleTestModel } from './src/services/geminiServer.ts';
import { SERVER_PORT, SERVER_HOST, HMR_ENABLED } from './src/config/serverConfig.ts';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      const jsonParser = express.json({ limit: '25mb' });
      const urlencodedParser = express.urlencoded({ extended: true, limit: '25mb' });

      server.middlewares.use((req, res, next) => {
        // Ensure standard Express response helpers exist in Connect middleware
        if (!(res as any).status) {
          (res as any).status = function (code: number) {
            this.statusCode = code;
            return this;
          };
        }
        if (!(res as any).json) {
          (res as any).json = function (obj: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(obj));
            return this;
          };
        }

        if (req.url?.startsWith('/api/')) {
          jsonParser(req as any, res as any, () => {
            urlencodedParser(req as any, res as any, () => {
              const urlPath = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';
              if (urlPath === '/api/chat/stream' && req.method === 'POST') {
                return handleChatStream(req as any, res as any);
              }
              if (urlPath === '/api/transcribe' && req.method === 'POST') {
                return handleTranscribeAudio(req as any, res as any);
              }
              if (urlPath === '/api/models/fetch' && req.method === 'POST') {
                return handleFetchModels(req as any, res as any);
              }
              if (urlPath === '/api/models/test' && req.method === 'POST') {
                return handleTestModel(req as any, res as any);
              }
              next();
            });
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      apiServerPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
        manifest: {
          id: '/',
          name: 'AuraChat AI - Trợ Lý AI Tối Giản',
          short_name: 'AuraChat',
          description: 'Ứng dụng chat AI thông minh phong cách tối giản hỗ trợ đồng bộ đa thiết bị.',
          theme_color: '#F59E0B',
          background_color: '#0c0a09',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      port: SERVER_PORT,
      host: SERVER_HOST,
      // Có thể tắt HMR bằng biến môi trường VITE_HMR=false hoặc DISABLE_HMR=true.
      hmr: HMR_ENABLED,
      watch: HMR_ENABLED ? {} : null,
    },
  };
});
