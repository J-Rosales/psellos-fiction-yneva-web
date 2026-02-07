#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ENTITY_TYPE_PRECEDENCE = [
  'persons',
  'groups',
  'polities',
  'institutions',
  'offices',
  'places',
  'artifacts',
  'texts',
  'sources',
  'species',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    distRun: '',
    out: 'public/data',
    strict: false,
    dryRun: false,
    report: '',
    scoreConfig: '',
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--dist-run') {
      args.distRun = argv[++i] ?? '';
    } else if (token === '--out') {
      args.out = argv[++i] ?? '';
    } else if (token === '--strict') {
      args.strict = true;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--report') {
      args.report = argv[++i] ?? '';
    } else if (token === '--score-config') {
      args.scoreConfig = argv[++i] ?? '';
    } else {
      fail(`Unknown argument: ${token}`);
    }
  }
  if (!args.distRun) {
    fail('Missing required argument: --dist-run <path>');
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listNonHidden(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath).filter((name) => !name.startsWith('.'));
}

function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const name of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, name), { recursive: true, force: true });
  }
}

function backupDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return null;
  }
  const hasContent = listNonHidden(dirPath).length > 0;
  if (!hasContent) {
    return null;
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dirPath}.bak.${timestamp}`;
  fs.cpSync(dirPath, backupPath, { recursive: true });
  return backupPath;
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function walkFiles(dirPath, acc = []) {
  if (!fs.existsSync(dirPath)) {
    return acc;
  }
  for (const name of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
  return acc;
}

function main() {
  const startedAt = new Date().toISOString();
  const args = parseArgs(process.argv);
  const distRun = path.resolve(process.cwd(), args.distRun);
  const outDir = path.resolve(process.cwd(), args.out);
  const reportPath = path.resolve(process.cwd(), args.report || path.join('docs', 'dist-run-import-report.json'));

  if (!fs.existsSync(distRun)) {
    fail(`Dist-run path not found: ${distRun}`);
  }

  const requiredEntries = ['machine', 'entities'];
  const optionalEntries = ['indexes', 'reports', 'narrative_layer_assertions.yml'];
  const missingRequired = requiredEntries.filter((entry) => !fs.existsSync(path.join(distRun, entry)));
  if (missingRequired.length > 0) {
    fail(`Missing required dist-run entries: ${missingRequired.join(', ')}`);
  }

  const warnings = [];
  const missingOptional = optionalEntries.filter((entry) => !fs.existsSync(path.join(distRun, entry)));
  if (missingOptional.length > 0) {
    const message = `Missing optional dist-run entries: ${missingOptional.join(', ')}`;
    if (args.strict) {
      fail(`${message} (strict mode)`);
    }
    warnings.push(message);
  }

  if (args.scoreConfig) {
    const scoreConfigPath = path.resolve(process.cwd(), args.scoreConfig);
    if (!fs.existsSync(scoreConfigPath)) {
      fail(`Score config not found: ${scoreConfigPath}`);
    }
  }

  const entityDir = path.join(distRun, 'entities');
  const entityFiles = walkFiles(entityDir).filter((filePath) => {
    const lower = filePath.toLowerCase();
    return lower.endsWith('.yml') || lower.endsWith('.yaml');
  });
  if (entityFiles.length === 0) {
    warnings.push('No .yml/.yaml entity files detected under entities/');
  }

  let backupPath = null;
  if (!args.dryRun) {
    ensureDir(outDir);
    backupPath = backupDir(outDir);
    clearDir(outDir);
  }

  const persons = buildPersons(path.join(distRun, 'machine'));
  if (!args.dryRun) {
    writeJson(path.join(outDir, 'persons.json'), persons);
  }

  const report = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    mode: args.dryRun ? 'dry-run' : 'apply',
    strict: args.strict,
    source: distRun,
    output: outDir,
    score_config: args.scoreConfig ? path.resolve(process.cwd(), args.scoreConfig) : null,
    backup_path: backupPath,
    checks: {
      required_entries: requiredEntries,
      optional_entries: optionalEntries,
      missing_optional: missingOptional,
      entity_yaml_files_count: entityFiles.length,
    },
    counts: {
      persons: Object.keys(persons).length,
    },
    warnings,
    note: 'D1 scaffold complete. Artifact generation pipeline is implemented in later milestones.',
  };

  writeJson(reportPath, report);
  console.log(`Import scaffold completed. Report written to ${reportPath}`);
}

function parseJsonFile(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function normalizeType(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function selectPrimaryType(types) {
  if (types.length === 0) {
    return 'unknown';
  }
  const ranked = [...types].sort((a, b) => {
    const ai = ENTITY_TYPE_PRECEDENCE.indexOf(a);
    const bi = ENTITY_TYPE_PRECEDENCE.indexOf(b);
    const safeAi = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeBi = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (safeAi !== safeBi) {
      return safeAi - safeBi;
    }
    return a.localeCompare(b);
  });
  return ranked[0];
}

function readCanonicalEntities(machineDir) {
  const files = fs
    .readdirSync(machineDir)
    .filter((name) => name.endsWith('.canonical.json'))
    .filter((name) => name !== 'assertions.canonical.json');

  const rows = [];
  for (const fileName of files) {
    const typeFromFile = normalizeType(fileName.replace('.canonical.json', ''));
    const payload = parseJsonFile(path.join(machineDir, fileName), null);
    if (!payload) continue;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.entities)
          ? payload.entities
          : Object.values(payload).filter((value) => typeof value === 'object' && value !== null);
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      rows.push({ typeFromFile, row: item });
    }
  }
  return rows;
}

function buildPersons(machineDir) {
  const entries = new Map();
  const rows = readCanonicalEntities(machineDir);
  for (const { typeFromFile, row } of rows) {
    const qid = String(row.qid ?? row.id ?? '').trim();
    if (!qid) continue;
    const sourceTypes = new Set([
      typeFromFile,
      normalizeType(row.entity_type),
      ...(Array.isArray(row.entity_types) ? row.entity_types.map((v) => normalizeType(v)) : []),
      normalizeType(row.type),
    ].filter(Boolean));
    const sourceEntityIds = Array.isArray(row.source_entity_ids)
      ? row.source_entity_ids.map((value) => String(value)).filter(Boolean)
      : row.source_entity_id
        ? [String(row.source_entity_id)]
        : row.id
          ? [String(row.id)]
          : [];

    const existing = entries.get(qid) ?? {
      id: qid,
      qid,
      label: String(row.label ?? row.name ?? qid),
      entity_types: [],
      source_entity_ids: [],
    };

    const mergedTypes = new Set([...(existing.entity_types ?? []), ...sourceTypes]);
    const mergedSourceIds = new Set([...(existing.source_entity_ids ?? []), ...sourceEntityIds]);
    existing.entity_types = Array.from(mergedTypes).sort((a, b) => a.localeCompare(b));
    existing.entity_type = selectPrimaryType(existing.entity_types);
    existing.source_entity_ids = Array.from(mergedSourceIds).sort((a, b) => a.localeCompare(b));
    existing.label = String(existing.label ?? row.label ?? row.name ?? qid);
    entries.set(qid, existing);
  }

  return Object.fromEntries(
    Array.from(entries.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((qid) => [qid, entries.get(qid)]),
  );
}

main();
