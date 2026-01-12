import { normalizeAssertion, type NormalizedAssertion } from './normalizeAssertion';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAssertionsById(
  value: unknown,
): Record<string, NormalizedAssertion> {
  if (!isRecord(value)) {
    throw new Error('Invalid assertions_by_id: expected an object');
  }

  const mapping: Record<string, NormalizedAssertion> = {};
  let index = 0;

  for (const [assertionId, entry] of Object.entries(value)) {
    mapping[assertionId] = normalizeAssertion(entry, index);
    index += 1;
  }

  return mapping;
}

export async function loadAssertionsById(
  assertionsByIdUrl = '/data/assertions_by_id.json',
): Promise<Record<string, NormalizedAssertion>> {
  const response = await fetch(assertionsByIdUrl);

  if (!response.ok) {
    throw new Error(`Failed to load assertions_by_id: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return assertAssertionsById(payload);
}

export type { NormalizedAssertion as AssertionRecord };
