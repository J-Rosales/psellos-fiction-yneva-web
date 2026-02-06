import type { FastifyRequest } from 'fastify';
import type { Repository } from './repository';
import { makeApiError, normalizeLayer, type SuccessMeta } from './contracts';

export function resolveLayer(request: FastifyRequest, repo: Repository, requestedLayer?: string): {
  layer: string;
  known: boolean;
  warnings: string[];
} {
  const layer = normalizeLayer(requestedLayer);
  const known = repo.isKnownLayer(layer);
  const warnings = known ? [] : [`Unknown layer '${layer}', returning empty result set.`];
  return { layer, known, warnings };
}

export function buildSuccessMeta(layer: string, resultCount: number, warnings: string[]): SuccessMeta {
  const meta: SuccessMeta = {
    layer,
    result_count: resultCount,
  };
  if (warnings.length > 0) {
    meta.warnings = warnings;
  }
  return meta;
}

export function buildBadRequestError(request: FastifyRequest, message: string, layer?: string) {
  return makeApiError(400, message, request.id, layer);
}
