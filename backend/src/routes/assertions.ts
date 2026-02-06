import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { assertionsQuerySchema } from '../lib/contracts';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerAssertionRoutes(app: FastifyInstance, repo: Repository): Promise<void> {
  app.get('/api/assertions', async (request, reply) => {
    const parsed = assertionsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    const items = known ? repo.listAssertions(layer) : [];
    return {
      meta: buildSuccessMeta(layer, items.length, warnings),
      items,
    };
  });
}
