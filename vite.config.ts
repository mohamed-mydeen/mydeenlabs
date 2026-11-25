import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { IncomingMessage, ServerResponse } from 'http';

function vercelApiDevPlugin(envVars: Record<string, string>): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      Object.assign(process.env, envVars);

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url || '';
        if (
          !url.startsWith('/api/analytics') &&
          !url.startsWith('/api/heartbeat') &&
          !url.startsWith('/api/contact')
        ) {
          return next();
        }

        try {
          const parsedUrl = new URL(url, 'http://localhost');
          const query: Record<string, string> = {};
          parsedUrl.searchParams.forEach((v, k) => {
            query[k] = v;
          });

          let body: unknown = undefined;
          if (req.method === 'POST') {
            body = await new Promise((resolve) => {
              let raw = '';
              req.on('data', (chunk) => {
                raw += chunk;
              });
              req.on('end', () => {
                try {
                  resolve(raw ? JSON.parse(raw) : {});
                } catch {
                  resolve({});
                }
              });
            });
          }

          const modulePath =
            parsedUrl.pathname === '/api/heartbeat'
              ? '/api/heartbeat.ts'
              : parsedUrl.pathname === '/api/contact'
              ? '/api/contact.ts'
              : '/api/analytics.ts';
          const mod = await server.ssrLoadModule(modulePath);

          const vercelReq = Object.assign(req, { query, body });
          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(payload: unknown) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(payload));
              return vercelRes;
            },
          });

          await mod.default(vercelReq, vercelRes);
        } catch (err) {
          console.error('Dev API error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Unable to load analytics data. Please try again.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      vercelApiDevPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'apple-touch-icon.png',
          'offline.html',
        ],
        manifest: {
          name: 'Mydeen Analytics',
          short_name: 'Mydeen',
          description: 'Private website analytics and business dashboard.',
          start_url: '/login',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          theme_color: '#E8D2B5',
          background_color: '#E8D2B5',
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
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            // CRITICAL SECURITY: Never cache authenticated API responses, Supabase sessions, or private data
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/.*posthog\.com\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5174,
    },
  };
});
