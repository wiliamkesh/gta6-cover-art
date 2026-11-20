// Smart crop: a face-aware focus finder that runs entirely on the machine.
// It scores a low-resolution copy of the photo for warm skin tones and busy
// detail, then points the panel's crop at the strongest region. It is a
// heuristic, not a detector — it finds people far more often than it misses.

/** Skin-tone likelihood of one pixel, 0..1. */
export function skinScore(r, g, b) {
  if (r < 70 || r <= g + 12 || r <= b + 18 || g <= b + 4) return 0;
  const warmth = Math.min(1, (r - g) / 70);
  const sat = (r - Math.min(g, b)) / Math.max(1, r);
  return Math.min(1, warmth * 0.7 + sat * 0.6);
}

/**
 * Finds the focus point {fx, fy} (0..1) for `img`. `aspect` is the panel's
 * width/height; the search favours a window of that shape.
 */
export function findFocus(img, aspect = 1) {
  const S = 72;
  const off = document.createElement('canvas');
  off.width = S; off.height = S;
  const g = off.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, S, S);
  let data;
  try {
    data = g.getImageData(0, 0, S, S).data;
  } catch {
    return { fx: 0.5, fy: 0.42 };
  }
  const cell = 8;
  const n = S / cell;
  const score = new Float32Array(n * n);
  for (let cy = 0; cy < n; cy++) {
    for (let cx = 0; cx < n; cx++) {
      let skin = 0;
      let edge = 0;
      let lum = 0;
      let count = 0;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const i = ((cy * cell + y) * S + cx * cell + x) * 4;
          const r = data[i], gg = data[i + 1], b = data[i + 2];
          skin += skinScore(r, gg, b);
          lum += (r + gg + b) / 3;
          count++;
        }
      }
      const mean = lum / count;
      for (let y = 0; y < cell; y += 2) {
        for (let x = 0; x < cell; x += 2) {
          const i = ((cy * cell + y) * S + cx * cell + x) * 4;
          const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
          edge += Math.abs(l - mean);
        }
      }
      score[cy * n + cx] = (skin / count) * 3 + Math.min(1, edge / (count * 40)) * 0.8;
    }
  }
  // Best 3x3 window, with a gentle pull toward the upper-middle third,
  // where faces usually sit in a portrait.
  let best = -1;
  let bx = 0.5;
  let by = 0.42;
  const win = aspect >= 1 ? 3 : 2;
  for (let cy = 0; cy <= n - win; cy++) {
    for (let cx = 0; cx <= n - win; cx++) {
      let sum = 0;
      for (let wy = 0; wy < win; wy++) {
        for (let wx = 0; wx < win; wx++) sum += score[(cy + wy) * n + cx + wx];
      }
      const ccx = (cx + win / 2) / n;
      const ccy = (cy + win / 2) / n;
      const pull = 1 - 0.25 * Math.hypot(ccx - 0.5, (ccy - 0.38) * 1.4);
      const total = sum * pull;
      if (total > best) {
        best = total;
        bx = ccx;
        by = ccy;
      }
    }
  }
  return { fx: Math.min(0.92, Math.max(0.08, bx)), fy: Math.min(0.92, Math.max(0.08, by)) };
}
