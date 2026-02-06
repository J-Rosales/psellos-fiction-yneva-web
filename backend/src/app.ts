import Fastify, { type FastifyInstance } from 'fastify';
import type { Repository } from './lib/repository';
import { ArtifactRepository } from './lib/repository';
import { ApiMetricsStore, registerObservabilityHooks } from './lib/observability';
import { registerAssertionRoutes } from './routes/assertions';
import { registerDiagnosticsRoutes } from './routes/diagnostics';
import { registerEntityRoutes } from './routes/entities';
import { registerGraphRoutes } from './routes/graph';
import { registerLayerRoutes } from './routes/layers';
import { registerMapRoutes } from './routes/map';

export interface AppOptions {
  repository?: Repository;
}

export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  const repo = options.repository ?? new ArtifactRepository();
  const metrics = new ApiMetricsStore();
  registerObservabilityHooks(app, metrics);

  await registerEntityRoutes(app, repo);
  await registerAssertionRoutes(app, repo);
  await registerGraphRoutes(app, repo);
  await registerMapRoutes(app, repo);
  await registerLayerRoutes(app, repo);
  await registerDiagnosticsRoutes(app, repo, metrics);

  return app;
}
