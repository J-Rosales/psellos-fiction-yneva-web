export function computeViewportHeightPx(
  viewportHeight: number,
  topOffset: number,
  minHeight = 320,
): number {
  const raw = Math.floor(viewportHeight - topOffset - 8);
  return Math.max(minHeight, raw);
}
