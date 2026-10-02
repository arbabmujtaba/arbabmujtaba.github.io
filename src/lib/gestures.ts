/**
 * The wand's two gestures, read from the path the pointer traces while it
 * hovers (never while a button is held, so selecting text can't cast).
 * Pure functions — tested in tests/hiddenLayer.test.ts.
 */

export interface Point {
  x: number;
  y: number;
  t: number;
}

/** Cumulative signed turning angle of a path — a drawn circle turns ~2π. */
export function turning(points: Point[]): number {
  let total = 0;
  for (let i = 2; i < points.length; i += 1) {
    const a = Math.atan2(points[i - 1].y - points[i - 2].y, points[i - 1].x - points[i - 2].x);
    const b = Math.atan2(points[i].y - points[i - 1].y, points[i].x - points[i - 1].x);
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    total += d;
  }
  return total;
}

export function isCircle(points: Point[]): boolean {
  if (points.length < 12) return false;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  if (w < 50 || h < 50 || w > 460 || h > 460) return false;
  const ratio = w / h;
  if (ratio < 0.5 || ratio > 2) return false;
  // Start and end near each other, and the path really went around.
  const closed = Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < Math.max(w, h) * 0.6;
  return closed && Math.abs(turning(points)) > Math.PI * 1.75;
}

export function isShake(points: Point[]): boolean {
  if (points.length < 8) return false;
  let reversals = 0;
  let direction = 0;
  let run = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const sign = Math.sign(dx);
    if (sign === 0) continue;
    if (sign === direction) run += Math.abs(dx);
    else {
      if (direction !== 0 && run > 28) reversals += 1;
      direction = sign;
      run = Math.abs(dx);
    }
  }
  const ys = points.map((p) => p.y);
  return reversals >= 4 && Math.max(...ys) - Math.min(...ys) < 140;
}

