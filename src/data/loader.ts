import type { ProsopographyData } from './prosopography';

export interface ProsopographyDataLoader {
  load(): Promise<ProsopographyData>;
}

class FetchProsopographyDataLoader implements ProsopographyDataLoader {
  private readonly artifactUrl: string;

  constructor(artifactUrl: string) {
    this.artifactUrl = artifactUrl;
  }

  async load(): Promise<ProsopographyData> {
    const response = await fetch(this.artifactUrl);

    if (!response.ok) {
      throw new Error(`Failed to load prosopography data: ${response.status}`);
    }

    return (await response.json()) as ProsopographyData;
  }
}

export function createProsopographyDataLoader(
  artifactUrl = '/data/prosopography.json',
): ProsopographyDataLoader {
  // TODO: confirm artifact name(s) and path(s) from psellos-builder output bundle.
  return new FetchProsopographyDataLoader(artifactUrl);
}
