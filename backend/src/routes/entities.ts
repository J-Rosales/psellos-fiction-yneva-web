import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { entitiesQuerySchema } from '../lib/contracts';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerEntityRoutes(app: FastifyInstance, repo: Repository): Promise<void> {
  app.get('/api/entities', async (request, reply) => {
    const parsed = entitiesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    const items = known ? repo.listEntities(layer) : [];
    return {
      meta: buildSuccessMeta(layer, items.length, warnings),
      items,
    };
  });

  app.get('/api/entities/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id;
    if (!id) {
      return reply.status(400).send(buildBadRequestError(request, 'Missing entity id'));
    }
    const parsed = entitiesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    if (!known) {
      return {
        meta: buildSuccessMeta(layer, 0, warnings),
        item: null,
      };
    }
    const item = repo.getEntityById(layer, id);
    if (!item) {
      return reply.status(404).send({
        status: 404,
        message: `Entity '${id}' not found`,
        request_id: request.id,
        layer,
      });
    }
    return {
      meta: buildSuccessMeta(layer, 1, warnings),
      item,
    };
  });
}
