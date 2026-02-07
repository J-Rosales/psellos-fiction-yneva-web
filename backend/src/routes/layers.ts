import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { changelogQuerySchema, layerQuerySchema } from '../lib/contracts';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerLayerRoutes(app: FastifyInstance, repo: Repository): Promise<void> {
  app.get('/api/layers', async (request, reply) => {
    const parsed = layerQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    const items = repo.listLayers();
    return {
      meta: buildSuccessMeta(layer, known ? items.length : 0, warnings),
      items: known ? items : [],
    };
  });

  app.get('/api/layers/:id/changelog', async (request, reply) => {
    const layerId = (request.params as { id?: string }).id;
    if (!layerId) {
      return reply.status(400).send(buildBadRequestError(request, 'Missing layer id'));
    }
    const parsed = changelogQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const resolvedLayer = resolveLayer(request, repo, layerId);
    const resolvedBase = resolveLayer(request, repo, parsed.data.base);
    const warnings = [...resolvedLayer.warnings, ...resolvedBase.warnings];
    if (!resolvedLayer.known || !resolvedBase.known) {
      return {
        meta: buildSuccessMeta(resolvedLayer.layer, 0, warnings),
        item: {
          layer: resolvedLayer.layer,
          base: resolvedBase.layer,
          added: [],
          removed: [],
        },
      };
    }
    const item = repo.getLayerChangelog(resolvedLayer.layer, resolvedBase.layer);
    return {
      meta: buildSuccessMeta(resolvedLayer.layer, 1, warnings),
      item,
    };
  });
}
