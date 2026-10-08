import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { healthRouter } from './server/routes/health.router.ts';
import { auditRouter } from './server/routes/audit.router.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';
import { notFoundHandler } from './server/middleware/notFoundHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/audit', auditRouter);

  app.all('/api/*', notFoundHandler);

  if (!isProduction) {
    const { createServer } = await import('vite');

    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

async function startServer(): Promise<void> {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Server] GitHub Profile Auditor active at http://0.0.0.0:${PORT}`
    );
  });
}

if (process.env.RUN_SERVER !== 'false') {
  startServer().catch((err: unknown) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}