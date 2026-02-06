export interface ApiError {
  status: number;
  message: string;
  request_id: string;
  layer?: string;
}

export function makeError(
  status: number,
  message: string,
  requestId: string,
  layer?: string,
): ApiError {
  return { status, message, request_id: requestId, layer };
}
