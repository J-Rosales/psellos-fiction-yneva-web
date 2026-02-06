import { z } from 'zod';

export const layerQuerySchema = z.object({
  layer: z.string().optional().default('canon'),
});

export const entitiesQuerySchema = layerQuerySchema.extend({
  q: z.string().optional(),
  exact: z.coerce.boolean().optional().default(false),
  rel_type: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  entity_type: z.string().optional(),
  has_geo: z.enum(['any', 'yes', 'no']).optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  page_size: z.coerce.number().int().min(1).max(200).optional().default(25),
});

export const assertionsQuerySchema = entitiesQuerySchema.extend({
  entity_id: z.string().optional(),
});

export const graphQuerySchema = layerQuerySchema.extend({
  entity_id: z.string().optional(),
  depth: z.coerce.number().int().min(1).max(5).optional(),
  rel_type: z.string().optional(),
});

export const mapQuerySchema = entitiesQuerySchema.extend({
  bbox: z.string().optional(),
});

export const changelogQuerySchema = z.object({
  layer: z.string().optional().default('canon'),
  base: z.string().optional().default('canon'),
});

export interface ApiErrorShape {
  status: number;
  message: string;
  request_id: string;
  layer?: string;
}

export interface SuccessMeta {
  layer: string;
  result_count: number;
  total_count?: number;
  warnings?: string[];
  buckets?: Record<string, unknown>;
}

export function makeApiError(status: number, message: string, requestId: string, layer?: string): ApiErrorShape {
  return {
    status,
    message,
    request_id: requestId,
    layer,
  };
}

export function normalizeLayer(layer: string | undefined): string {
  if (!layer || layer.trim() === '') {
    return 'canon';
  }
  return layer.trim();
}
