// Vector illustration for Leonida Press: every hero cut-out is drawn here as flat
// canvas paths with clean alpha — a retro sun, palm silhouettes, a convertible
// cruiser and a dusk skyline. Nothing is a cut photo, so the cut-out can break a
// panel border without a ragged edge. Palettes follow the cover grade.

/** Tiny seeded random, so a skyline draws the same every render. */
export function seededRand(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tile of halftone dots, used as a fill pattern for drop shadows. */
export function halftonePattern(gap, color) {
  const tile = document.createElement('canvas');
  tile.width = gap * 2;
  tile.height = gap * 2;
  const t = tile.getContext('2d');
  t.fillStyle = color;
  t.beginPath(); t.arc(gap / 2, gap / 2, gap * 0.30, 0, Math.PI * 2); t.fill();
  t.beginPath(); t.arc(gap * 1.5, gap * 1.5, gap * 0.30, 0, Math.PI * 2); t.fill();
  return tile;
}

/**
 * Draws `drawFn` (a silhouette in any colour) onto a stamp, re-inks it with a
 * halftone dot pattern, and stamps it offset — the screenprint drop shadow that
 * makes a cut-out look like it floats above the poster.
 */
export function halftoneShadow(ctx, w, h, drawFn, dx, dy, gap, color) {
  const stamp = document.createElement('canvas');
  stamp.width = w; stamp.height = h;
  const g = stamp.getContext('2d');
  drawFn(g);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = g.createPattern(halftonePattern(gap, color), 'repeat');
  g.fillRect(0, 0, w, h);
  ctx.drawImage(stamp, dx, dy);
}

/** Retro sun: a gradient disc with horizontal slats cut from its lower half. */
export function drawRetroSun(ctx, cx, cy, r, top, bottom) {
  const off = document.createElement('canvas');
  const d = Math.ceil(r * 2 + 4);
  off.width = d; off.height = d;
  const g = off.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, d);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.beginPath(); g.arc(d / 2, d / 2, r, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'destination-out';
  let y = d / 2 + r * 0.08;
  let thick = r * 0.045;
  while (y < d / 2 + r) {
    g.fillRect(0, y, d, thick);
    y += thick + r * 0.16;
    thick *= 1.35;
  }
  ctx.drawImage(off, cx - d / 2, cy - d / 2);
}

/** One palm silhouette. (x, y) is the base, s the height, lean bends the crown. */
export function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const crownX = x + lean * s;
  const crownY = y - s;
  // Trunk: a tapering curve, drawn as a filled ribbon.
  ctx.beginPath();
  ctx.moveTo(x - s * 0.035, y);
  ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.55, crownX - s * 0.02, crownY);
  ctx.lineTo(crownX + s * 0.02, crownY);
  ctx.quadraticCurveTo(x + lean * s * 0.4 + s * 0.05, y - s * 0.5, x + s * 0.035, y);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven drooping crescents around the crown.
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.92) + (i * Math.PI * 0.92) / 6;
    const tipX = crownX + Math.cos(a) * s * 0.52;
    const tipY = crownY + Math.sin(a) * s * 0.42 + s * 0.16;
    const midX = crownX + Math.cos(a) * s * 0.30;
    const midY = crownY + Math.sin(a) * s * 0.22 - s * 0.05;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + s * 0.03, midY + s * 0.07, crownX, crownY + s * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath(); ctx.arc(crownX - s * 0.03, crownY + s * 0.03, s * 0.028, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(crownX + s * 0.035, crownY + s * 0.035, s * 0.024, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * Convertible cruiser, side profile facing right, in a 100 x 28 box.
 * (x, y) is the top-left of the box. Sleek on purpose: the length does the work,
 * so the car reads as a car even where the title crosses it.
 */
export function drawCruiser(ctx, x, y, w, pal) {
  const h = w * 0.28;
  const s = w / 100;
  ctx.save();
  ctx.translate(x, y);
  // Body: rear deck, raked windshield frame, long sloping hood, rounded nose.
  const body = new Path2D();
  body.moveTo(3 * s, 20 * s);
  body.lineTo(5 * s, 16.5 * s);
  body.bezierCurveTo(12 * s, 15.5 * s, 20 * s, 15 * s, 28 * s, 14.5 * s);
  body.lineTo(33 * s, 13 * s);
  body.lineTo(36 * s, 7 * s);
  body.lineTo(41 * s, 7 * s);
  body.lineTo(45 * s, 14 * s);
  body.lineTo(70 * s, 14 * s);
  body.bezierCurveTo(80 * s, 14 * s, 88 * s, 15.5 * s, 93 * s, 17 * s);
  body.lineTo(96 * s, 18.5 * s);
  body.lineTo(96 * s, 20.5 * s);
  body.quadraticCurveTo(96 * s, 23 * s, 92 * s, 23 * s);
  body.lineTo(8 * s, 23 * s);
  body.quadraticCurveTo(3 * s, 23 * s, 3 * s, 20 * s);
  body.closePath();
  ctx.fillStyle = pal.car;
  ctx.fill(body);
  ctx.lineWidth = 1.1 * s;
  ctx.strokeStyle = pal.carLine;
  ctx.stroke(body);
  // Darker lower skirt.
  ctx.beginPath();
  ctx.moveTo(5 * s, 21 * s);
  ctx.lineTo(94 * s, 21 * s);
  ctx.lineTo(94 * s, 23 * s);
  ctx.lineTo(5 * s, 23 * s);
  ctx.closePath();
  ctx.fillStyle = pal.carLine;
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Windshield glass, raked back.
  ctx.beginPath();
  ctx.moveTo(36.8 * s, 8 * s);
  ctx.lineTo(40.2 * s, 8 * s);
  ctx.lineTo(43.6 * s, 13.4 * s);
  ctx.lineTo(34.6 * s, 12.6 * s);
  ctx.closePath();
  ctx.fillStyle = pal.glass;
  ctx.fill();
  // Seats behind the windshield.
  ctx.fillStyle = pal.seat;
  for (const sx of [24, 29]) {
    ctx.beginPath();
    ctx.moveTo(sx * s, 14.5 * s);
    ctx.lineTo((sx + 1) * s, 9.5 * s);
    ctx.lineTo((sx + 3.6) * s, 9.5 * s);
    ctx.lineTo((sx + 4.4) * s, 14.5 * s);
    ctx.closePath();
    ctx.fill();
  }
  // Side mirror.
  ctx.strokeStyle = pal.carLine;
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(45 * s, 11.5 * s);
  ctx.lineTo(48 * s, 10.5 * s);
  ctx.stroke();
  ctx.fillStyle = pal.carLine;
  ctx.beginPath(); ctx.ellipse(48.6 * s, 10.3 * s, 1.3 * s, 0.9 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Chrome side stripe, door line and handle.
  ctx.beginPath();
  ctx.moveTo(6 * s, 19 * s);
  ctx.lineTo(93 * s, 19 * s);
  ctx.lineWidth = 0.9 * s;
  ctx.strokeStyle = pal.chrome;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(54 * s, 15 * s);
  ctx.lineTo(54 * s, 22.5 * s);
  ctx.lineWidth = 0.8 * s;
  ctx.strokeStyle = pal.carLine;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(59 * s, 16.5 * s);
  ctx.lineTo(63 * s, 16.5 * s);
  ctx.lineWidth = 0.9 * s;
  ctx.strokeStyle = pal.chrome;
  ctx.stroke();
  // Headlight and taillight.
  ctx.fillStyle = pal.light;
  ctx.beginPath(); ctx.ellipse(93.5 * s, 18 * s, 2.1 * s, 1.2 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.tail;
  ctx.beginPath(); ctx.ellipse(4.6 * s, 18 * s, 1.4 * s, 1 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Fender arches, then wheels tucked under the body.
  ctx.strokeStyle = pal.carLine;
  ctx.lineWidth = 1.4 * s;
  for (const wx of [24, 78]) {
    ctx.beginPath();
    ctx.arc(wx * s, 23 * s, 5.6 * s, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  for (const wx of [24, 78]) {
    ctx.beginPath(); ctx.arc(wx * s, 23 * s, 4.4 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.tire; ctx.fill();
    ctx.beginPath(); ctx.arc(wx * s, 23 * s, 2.7 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.wall; ctx.fill();
    ctx.beginPath(); ctx.arc(wx * s, 23 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.hub; ctx.fill();
  }
  ctx.restore();
}

/** Dusk skyline silhouette with a few lit windows. (x, y) is the baseline left. */
export function drawSkyline(ctx, x, y, w, h, color, lit, seed) {
  const rand = seededRand(seed);
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.07 + rand() * 0.09);
    const bh = h * (0.35 + rand() * 0.65);
    ctx.fillRect(bx, y - bh, bw, bh);
    if (rand() > 0.5) ctx.fillRect(bx + bw * 0.3, y - bh - h * 0.08, bw * 0.16, h * 0.08);
    bx += bw + w * 0.012;
  }
  ctx.fillStyle = lit;
  for (let i = 0; i < 26; i++) {
    const wx = x + rand() * w;
    const wy = y - rand() * h * 0.85;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.006), Math.max(2, h * 0.012));
  }
  ctx.restore();
}

/**
 * The pop-out hero group: sun, palms and cruiser (or skyline) arranged in the
 * lower band of the cover, so the art breaks the panel borders and gutters
 * instead of sitting inside one panel. `zone` is {x, y, w, h} in cover pixels.
 * The cruiser is sized from the zone height, so it never runs past the foot.
 */
export function drawPopoutGroup(ctx, W, H, zone, style, pal) {
  const shadowGap = Math.max(6, W * 0.007);
  const drawShapes = (g) => {
    if (style === 'skyline') {
      drawSkyline(g, zone.x, zone.y + zone.h * 0.94, zone.w, zone.h * 0.60, pal.silhouette, pal.lit, 7);
      drawPalm(g, zone.x + zone.w * 0.06, zone.y + zone.h * 0.96, zone.h * 0.70, 0.10, pal.silhouette);
      drawPalm(g, zone.x + zone.w * 0.92, zone.y + zone.h * 0.96, zone.h * 0.55, -0.12, pal.silhouette);
      drawRetroSun(g, zone.x + zone.w * 0.62, zone.y + zone.h * 0.24, zone.h * 0.26, pal.sunTop, pal.sunBottom);
    } else if (style === 'palms') {
      drawRetroSun(g, zone.x + zone.w * 0.5, zone.y + zone.h * 0.28, zone.h * 0.30, pal.sunTop, pal.sunBottom);
      drawPalm(g, zone.x + zone.w * 0.12, zone.y + zone.h * 0.97, zone.h * 0.85, 0.14, pal.silhouette);
      drawPalm(g, zone.x + zone.w * 0.40, zone.y + zone.h * 0.97, zone.h * 0.62, -0.06, pal.silhouette);
      drawPalm(g, zone.x + zone.w * 0.86, zone.y + zone.h * 0.97, zone.h * 0.72, -0.14, pal.silhouette);
    } else {
      const carH = zone.h * 0.55;
      const carW = carH / 0.28;
      const carX = zone.x + (zone.w - carW) / 2;
      const carY = zone.y + zone.h * 0.42;
      drawRetroSun(g, zone.x + zone.w * 0.72, zone.y + zone.h * 0.20, zone.h * 0.26, pal.sunTop, pal.sunBottom);
      drawPalm(g, zone.x + zone.w * 0.05, zone.y + zone.h * 0.97, zone.h * 0.85, 0.12, pal.silhouette);
      drawPalm(g, zone.x + zone.w * 0.20, zone.y + zone.h * 0.97, zone.h * 0.58, -0.05, pal.silhouette);
      drawCruiser(g, carX, carY, carW, pal);
    }
  };
  halftoneShadow(ctx, W, H, drawShapes, W * 0.016, H * 0.02, shadowGap, pal.shadow);
  drawShapes(ctx);
}

/** A full-bleed vector scene used as the third sample photo ("Studio vector"). */
export function makeVectorSample(size = 1080) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, '#2b1245');
  sky.addColorStop(0.45, '#c22a7a');
  sky.addColorStop(0.75, '#ff7a3d');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);
  const pal = {
    sunTop: '#ffe9a8', sunBottom: '#ff5e3a', silhouette: '#1c0f24',
    car: '#ff2e88', carLine: '#7a1038', chrome: '#ffe9a8', glass: '#9fe8e0',
    seat: '#2b1245', light: '#fff3dd', tail: '#ff3b30', tire: '#14100e',
    wall: '#fff3dd', hub: '#ffb62e', shadow: '#ff2e88', lit: '#ffd76b',
  };
  drawRetroSun(ctx, size * 0.5, size * 0.42, size * 0.20, pal.sunTop, pal.sunBottom);
  drawSkyline(ctx, 0, size * 0.78, size, size * 0.30, pal.silhouette, pal.lit, 11);
  drawPalm(ctx, size * 0.10, size * 0.80, size * 0.34, 0.12, pal.silhouette);
  drawPalm(ctx, size * 0.88, size * 0.80, size * 0.28, -0.12, pal.silhouette);
  ctx.fillStyle = '#160b1e';
  ctx.fillRect(0, size * 0.78, size, size * 0.22);
  drawCruiser(ctx, size * 0.16, size * 0.66, size * 0.68, pal);
  return c;
}
