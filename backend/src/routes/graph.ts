import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { graphQuerySchema } from '../lib/contracts';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerGraphRoutes(app: FastifyInstance, repo: Repository): Promise<void> {
  app.get('/api/graph/neighborhood', async (request, reply) => {
    const parsed = graphQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    if (!known) {
      return {
        meta: buildSuccessMeta(layer, 0, warnings),
        nodes: [],
        edges: [],
      };
    }
    const graph = repo.getGraphNeighborhood(layer, {
      entityId: parsed.data.entity_id,
      depth: parsed.data.depth,
      relType: parsed.data.rel_type,
    });
    return {
      meta: buildSuccessMeta(layer, graph.edges.length, warnings),
      nodes: graph.nodes,
      edges: graph.edges,
    };
  });
}
