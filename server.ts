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

async function startServer(): Promise<void> {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Middlewares
  app.use(express.json());

  // API Endpoints
  app.use('/api/health', healthRouter);
  app.use('/api/audit', auditRouter);

  // Guard: Catch unhandled /api/* calls so they return standard JSON errors
  app.all('/api/*', notFoundHandler);

  if (!isProduction) {
    // Vite middleware for development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Central error handling
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] GitHub Profile Auditor active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err: unknown) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
