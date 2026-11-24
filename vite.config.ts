import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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
    plugins: [react(), vercelApiDevPlugin(env)],
    server: {
      port: 5174,
    },
  };
});
