import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Milestone 6 policy checks wiring', () => {
  it('defines runnable policy check scripts in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['check:spec-adr-sync']).toBeTruthy();
    expect(pkg.scripts?.['check:url-policy']).toBeTruthy();
    expect(pkg.scripts?.['check:artifact-contract']).toBeTruthy();
    expect(pkg.scripts?.['check:milestone6']).toBeTruthy();
  });
});

