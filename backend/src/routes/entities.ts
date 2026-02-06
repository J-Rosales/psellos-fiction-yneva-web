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
    const listed = known
      ? repo.listEntities(layer, {
          q: parsed.data.q,
          exact: parsed.data.exact,
          rel_type: parsed.data.rel_type,
          entity_type: parsed.data.entity_type,
          page: parsed.data.page,
          pageSize: parsed.data.page_size,
        })
      : { items: [], totalCount: 0, buckets: { unknown_label_count: 0, ambiguous_label_count: 0 } };
    const result = Array.isArray(listed)
      ? { items: listed, totalCount: listed.length, buckets: { unknown_label_count: 0, ambiguous_label_count: 0 } }
      : listed;
    return {
      meta: {
        ...buildSuccessMeta(layer, result.items.length, warnings),
        total_count: result.totalCount,
        buckets: result.buckets,
      },
      items: result.items,
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
