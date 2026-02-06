#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

function parseArgs(argv) {
  const out = {
    dataDir: 'public/data',
    apply: false,
    report: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--data-dir') out.dataDir = argv[++i];
    else if (token === '--apply') out.apply = true;
    else if (token === '--report') out.report = argv[++i];
  }
  return out;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function extractId(record, key) {
  if (typeof record[key] === 'string') return record[key];
  const alt = `${key}Id`;
  if (typeof record[alt] === 'string') return record[alt];
  return null;
}

async function run() {
  const args = parseArgs(process.argv);
  const dataDir = path.resolve(process.cwd(), args.dataDir);
  const schemaPath = path.resolve(process.cwd(), 'backend/sql/schema.sql');

  const persons = readJson(path.join(dataDir, 'persons.json'), {});
  const assertionsById = readJson(path.join(dataDir, 'assertions_by_id.json'), {});
  const assertionsByLayer = readJson(path.join(dataDir, 'assertions_by_layer.json'), {});

  const layers = Object.keys(assertionsByLayer);
  const assertionRows = [];
  const edgeRows = [];

  for (const layer of layers) {
    for (const assertionId of assertionsByLayer[layer] ?? []) {
      const payload = assertionsById[assertionId];
      if (!payload || typeof payload !== 'object') continue;
      const subject = extractId(payload, 'subject');
      const predicate = typeof payload.predicate === 'string' ? payload.predicate : null;
      const object = extractId(payload, 'object');
      assertionRows.push({ id: assertionId, layer, subject, predicate, object, payload });
      edgeRows.push({ id: assertionId, layer, subject, predicate, object });
    }
  }

  const report = {
    data_dir: dataDir,
    apply: args.apply,
    counts: {
      layers: layers.length,
      persons: Object.keys(persons).length,
      assertions: assertionRows.length,
      edges: edgeRows.length,
    },
    warnings: [],
    failures: [],
  };

  if (!args.apply) {
    const payload = JSON.stringify(report, null, 2);
    console.log(payload);
    if (args.report) fs.writeFileSync(args.report, payload);
    return;
  }

  if (!process.env.DATABASE_URL) {
    report.failures.push('DATABASE_URL is required with --apply');
    const payload = JSON.stringify(report, null, 2);
    console.log(payload);
    if (args.report) fs.writeFileSync(args.report, payload);
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('TRUNCATE edges, assertions, person_place_links, places, persons, layers CASCADE');

    for (const layer of layers) {
      await client.query('INSERT INTO layers (id, label) VALUES ($1, $2)', [layer, layer]);
    }

    for (const [personId, payload] of Object.entries(persons)) {
      await client.query('INSERT INTO persons (id, payload) VALUES ($1, $2::jsonb)', [personId, JSON.stringify(payload)]);
    }

    for (const row of assertionRows) {
      await client.query(
        'INSERT INTO assertions (id, layer_id, subject_id, predicate, object_id, payload) VALUES ($1, $2, $3, $4, $5, $6::jsonb)',
        [row.id, row.layer, row.subject, row.predicate, row.object, JSON.stringify(row.payload)],
      );
    }

    for (const row of edgeRows) {
      await client.query(
        'INSERT INTO edges (id, layer_id, subject_id, predicate, object_id) VALUES ($1, $2, $3, $4, $5)',
        [row.id, row.layer, row.subject, row.predicate, row.object],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    report.failures.push(String(error));
    throw error;
  } finally {
    await client.end();
  }

  const payload = JSON.stringify(report, null, 2);
  console.log(payload);
  if (args.report) fs.writeFileSync(args.report, payload);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
