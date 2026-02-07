import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { layerQuerySchema } from '../lib/contracts';
import type { ApiMetricsStore } from '../lib/observability';
import { buildBadRequestError, buildSuccessMeta, resolveLayer } from '../lib/response';
import type { Repository } from '../lib/repository';

export async function registerDiagnosticsRoutes(
  app: FastifyInstance,
  repo: Repository,
  metrics: ApiMetricsStore,
): Promise<void> {
  app.get('/api/diagnostics/metrics', async () => {
    return {
      meta: buildSuccessMeta('canon', 1, []),
      item: metrics.snapshot(),
    };
  });

  app.get('/api/diagnostics/layer-consistency', async (request, reply) => {
    const parsed = layerQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    if (!known) {
      return {
        meta: buildSuccessMeta(layer, 0, warnings),
        item: {
          layer,
          entities_count: 0,
          assertions_count: 0,
          graph_edges_count: 0,
          map_features_count: 0,
          checks: {
            graph_edges_within_assertions: true,
            map_features_within_assertions: true,
          },
        },
      };
    }
    const entities = repo.listEntities(layer);
    const entityCount = Array.isArray(entities) ? entities.length : entities.totalCount;
    const assertions = repo.listAssertions(layer);
    const graph = repo.getGraphNeighborhood(layer);
    const map = repo.getMapFeatures(layer);
    const mapFeaturesCount = Array.isArray(map) ? map.length : map.features.length;

    return {
      meta: buildSuccessMeta(layer, 1, warnings),
      item: {
        layer,
        entities_count: entityCount,
        assertions_count: assertions.length,
        graph_edges_count: graph.edges.length,
        map_features_count: mapFeaturesCount,
        checks: {
          graph_edges_within_assertions: graph.edges.length <= assertions.length,
          map_features_within_assertions: mapFeaturesCount <= assertions.length,
        },
      },
    };
  });

  app.get('/api/diagnostics/aggregate', async (request, reply) => {
    const parsed = layerQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(buildBadRequestError(request, z.prettifyError(parsed.error)));
    }
    const { layer, known, warnings } = resolveLayer(request, repo, parsed.data.layer);
    if (!known) {
      return {
        meta: buildSuccessMeta(layer, 1, warnings),
        item: {
          layer,
          assertion_quality: {
            entity_total: 0,
            unknown_label_count: 0,
            ambiguous_label_count: 0,
            unknown_entity_type_count: 0,
            unknown_label_sample_ids: [],
            unknown_entity_type_sample_ids: [],
            sample_limited: false,
          },
          geo_coverage: {
            place_groups: 0,
            unknown_geo_assertion_count: 0,
            ambiguous_place_group_count: 0,
          },
        },
      };
    }
    const entitySummary = repo.listEntities(layer, { page: 0, pageSize: 200 });
    const map = repo.getMapFeatures(layer);
    const sampleUnknownLabelIds = entitySummary.items
      .filter((item) => String(item.label ?? '').trim() === '')
      .slice(0, 25)
      .map((item) => String(item.id ?? ''));
    const sampleUnknownTypeIds = entitySummary.items
      .filter((item) => String(item.entity_type ?? '').trim() === '')
      .slice(0, 25)
      .map((item) => String(item.id ?? ''));

    return {
      meta: buildSuccessMeta(layer, 1, warnings),
      item: {
        layer,
        assertion_quality: {
          entity_total: entitySummary.totalCount,
          unknown_label_count: Number(entitySummary.buckets?.unknown_label_count ?? 0),
          ambiguous_label_count: Number(entitySummary.buckets?.ambiguous_label_count ?? 0),
          unknown_entity_type_count: Number(entitySummary.buckets?.unknown_entity_type_count ?? 0),
          unknown_label_sample_ids: sampleUnknownLabelIds,
          unknown_entity_type_sample_ids: sampleUnknownTypeIds,
          sample_limited: entitySummary.totalCount > entitySummary.items.length,
        },
        geo_coverage: {
          place_groups: map.groups.length,
          unknown_geo_assertion_count: Number(map.buckets?.unknown_geo_assertion_count ?? 0),
          ambiguous_place_group_count: Number(map.buckets?.ambiguous_place_group_count ?? 0),
        },
      },
    };
  });
}
