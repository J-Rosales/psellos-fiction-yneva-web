#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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
    warnings,
    note: 'D1 scaffold complete. Artifact generation pipeline is implemented in later milestones.',
  };

  writeJson(reportPath, report);
  console.log(`Import scaffold completed. Report written to ${reportPath}`);
}

main();
