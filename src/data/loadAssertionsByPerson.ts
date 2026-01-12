function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertAssertionsByPerson(
  value: unknown,
): Record<string, string[]> {
  if (!isRecord(value)) {
    throw new Error('Invalid assertions_by_person: expected an object');
  }

  const mapping: Record<string, string[]> = {};

  for (const [personId, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) {
      throw new Error(
        `Invalid assertions_by_person: entry ${personId} must be an array`,
      );
    }

    entry.forEach((assertionId, index) => {
      if (typeof assertionId !== 'string') {
        throw new Error(
          `Invalid assertions_by_person: entry ${personId} at ${index} must be a string`,
        );
      }
    });

    mapping[personId] = entry as string[];
  }

  return mapping;
}

export async function loadAssertionsByPerson(
  assertionsByPersonUrl = '/data/assertions_by_person.json',
): Promise<Record<string, string[]>> {
  const response = await fetch(assertionsByPersonUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to load assertions_by_person: ${response.status}`,
    );
  }

  const payload = (await response.json()) as unknown;
  return assertAssertionsByPerson(payload);
}

export type AssertionsByPerson = Record<string, string[]>;
