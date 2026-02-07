import { describe, expect, it } from 'vitest';
import { computeViewportHeightPx } from './viewportLayout';

describe('computeViewportHeightPx', () => {
  it('subtracts top offset from viewport height', () => {
    expect(computeViewportHeightPx(1000, 220)).toBe(772);
  });

  it('enforces minimum height', () => {
    expect(computeViewportHeightPx(400, 300)).toBe(320);
  });
});
