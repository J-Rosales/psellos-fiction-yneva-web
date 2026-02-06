import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.resolve(root, 'docs/m7-release-gate-report.json');

function runCommand(command, args) {
  const started = new Date();
  const result = spawnSync(command, args, {
    cwd: root,
    shell: true,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const ended = new Date();
  return {
    command: `${command} ${args.join(' ')}`.trim(),
    ok: result.status === 0,
    status: result.status,
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    stdout_tail: String(result.stdout ?? '').split('\n').slice(-20).join('\n'),
    stderr_tail: String(result.stderr ?? '').split('\n').slice(-20).join('\n'),
  };
}

const checks = [
  runCommand('npm', ['run', 'build']),
  runCommand('npm', ['run', 'test:unit']),
  runCommand('npm', ['run', 'test:e2e']),
  runCommand('npm', ['run', 'check:milestone6']),
];

const allPassed = checks.every((check) => check.ok);
const report = {
  generated_at: new Date().toISOString(),
  milestone: 'milestone-7-desktop-stable-release-gate',
  passed: allPassed,
  checks,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(JSON.stringify(report, null, 2));

process.exit(allPassed ? 0 : 1);

