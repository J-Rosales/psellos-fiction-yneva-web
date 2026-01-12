export interface ProsopographyEntity {
  id: string;
  label: string;
  // TODO: align entity fields with psellos-builder output (titles, metadata, temporal data).
  [key: string]: unknown;
}

export interface ProsopographyRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  // TODO: align relationship attributes with psellos-builder output (confidence, citations).
  [key: string]: unknown;
}

export interface NarrativeLayer {
  id: string;
  label: string;
  // TODO: align narrative layer fields with psellos-builder output (scope, ordering).
  [key: string]: unknown;
}

export interface ProsopographyData {
  entities: ProsopographyEntity[];
  relationships: ProsopographyRelationship[];
  narratives: NarrativeLayer[];
  [key: string]: unknown;
}
