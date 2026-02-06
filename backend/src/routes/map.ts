import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { mapQuerySchema } from '../lib/contracts';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerMapRoutes(app: FastifyInstance, repo: Repository): Promise<void> {
  app.get('/api/map/features', async (request, reply) => {
    const parsed = mapQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    const result = known
      ? repo.getMapFeatures(layer, { rel_type: parsed.data.rel_type, q: parsed.data.q })
      : {
          features: [],
          groups: [],
          buckets: { unknown_geo_assertion_count: 0, ambiguous_place_group_count: 0 },
        };
    return {
      meta: {
        ...buildSuccessMeta(layer, result.features.length, warnings),
        buckets: result.buckets,
      },
      type: 'FeatureCollection',
      features: result.features,
      groups: result.groups,
    };
  });
}
