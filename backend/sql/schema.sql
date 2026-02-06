CREATE TABLE IF NOT EXISTS layers (
  id TEXT PRIMARY KEY,
  label TEXT
);

CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS assertions (
  id TEXT PRIMARY KEY,
  layer_id TEXT NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  subject_id TEXT,
  predicate TEXT,
  object_id TEXT,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  layer_id TEXT NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  subject_id TEXT,
  predicate TEXT,
  object_id TEXT
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  label TEXT,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS person_place_links (
  person_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  layer_id TEXT NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
  payload JSONB,
  PRIMARY KEY (person_id, place_id, layer_id)
);
