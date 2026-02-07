import type { FastifyRequest } from 'fastify';
import type { Repository } from './repository';
import { makeApiError, normalizeLayer, type SuccessMeta } from './contracts';

export function resolveLayer(request: FastifyRequest, repo: Repository, requestedLayer?: string): {
  layer: string;
  known: boolean;
  warnings: string[];
} {
  const requested = normalizeLayer(requestedLayer);
  if (repo.isKnownLayer(requested)) {
    return { layer: requested, known: true, warnings: [] };
  }

  const resolvedAlias = resolveLayerAlias(requested, repo.listLayers());
  if (resolvedAlias) {
    return {
      layer: resolvedAlias,
      known: true,
      warnings: [`Layer alias '${requested}' mapped to canonical layer '${resolvedAlias}'.`],
    };
  }

  return {
    layer: requested,
    known: false,
    warnings: [`Unknown layer '${requested}', returning empty result set.`],
  };
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

function resolveLayerAlias(requested: string, knownLayers: string[]): string | null {
  const key = layerLooseKey(requested);
  const matches = knownLayers.filter((candidate) => layerLooseKey(candidate) === key);
  if (matches.length === 1) {
    return matches[0];
  }
  return null;
}

function layerLooseKey(layer: string): string {
  return layer.toLowerCase().replace(/[^a-z0-9]/g, '');
}
