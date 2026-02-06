import { makeError } from "./error";

export interface {{RESOURCE_PASCAL}}Query {
  layer?: string;
}

export interface {{RESOURCE_PASCAL}}Response {
  layer: string;
  result_count: number;
  items: unknown[];
  warnings?: string[];
}

export async function get{{RESOURCE_PASCAL}}(
  query: {{RESOURCE_PASCAL}}Query,
  requestId: string,
): Promise<{{RESOURCE_PASCAL}}Response | ReturnType<typeof makeError>> {
  const layer = query.layer || "canon";
  if (!layer) {
    return makeError(400, "Invalid layer", requestId, layer);
  }

  return {
    layer,
    result_count: 0,
    items: [],
  };
}
