import Fastify, { type FastifyInstance } from 'fastify';
import type { Repository } from './lib/repository';
import { ArtifactRepository } from './lib/repository';
import { registerAssertionRoutes } from './routes/assertions';
import { registerEntityRoutes } from './routes/entities';
import { registerGraphRoutes } from './routes/graph';
import { registerLayerRoutes } from './routes/layers';
import { registerMapRoutes } from './routes/map';

export interface AppOptions {
  repository?: Repository;
}

export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  const repo = options.repository ?? new ArtifactRepository();

  await registerEntityRoutes(app, repo);
  await registerAssertionRoutes(app, repo);
  await registerGraphRoutes(app, repo);
  await registerMapRoutes(app, repo);
  await registerLayerRoutes(app, repo);

  return app;
}
