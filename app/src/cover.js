// The cover engine: layouts, grades, lettering and print finish, all drawn on
// one 2D canvas. Everything is proportional to the canvas size, so the same code
// renders the live preview, the game-case thumbnail and the full-size export.

import { drawPopoutGroup, halftonePattern } from './vector.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = {
  'vice-nine': {
    name: 'Vice Nine',
    blurb: 'Six panels, hero up top',
    panels: [
      { x: 0.02, y: 0.055, w: 0.60, h: 0.50, role: 'The Driver' },
      { x: 0.635, y: 0.055, w: 0.345, h: 0.235, role: 'The Insider' },
      { x: 0.635, y: 0.305, w: 0.345, h: 0.25, role: 'The Boss' },
      { x: 0.02, y: 0.575, w: 0.315, h: 0.365, role: 'The Rider' },
      { x: 0.35, y: 0.575, w: 0.315, h: 0.365, role: 'The Fixer' },
      { x: 0.68, y: 0.575, w: 0.30, h: 0.365, role: 'The Courier' },
    ],
    titleY: 0.50,
    popout: { x: 0.06, y: 0.56, w: 0.88, h: 0.36 },
  },
  'hero-split': {
    name: 'Hero Split',
    blurb: 'One tall hero, three stacked',
    panels: [
      { x: 0.02, y: 0.055, w: 0.56, h: 0.885, role: 'The Driver' },
      { x: 0.595, y: 0.055, w: 0.385, h: 0.285, role: 'The Insider' },
      { x: 0.595, y: 0.355, w: 0.385, h: 0.285, role: 'The Boss' },
      { x: 0.595, y: 0.655, w: 0.385, h: 0.285, role: 'The Courier' },
    ],
    titleY: 0.60,
    popout: { x: 0.06, y: 0.62, w: 0.88, h: 0.30 },
  },
  'sunset-strips': {
    name: 'Sunset Strips',
    blurb: 'Full-bleed hero over four',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.50, role: 'The Driver', bleed: true },
      { x: 0.02, y: 0.52, w: 0.225, h: 0.42, role: 'The Rider' },
      { x: 0.265, y: 0.52, w: 0.225, h: 0.42, role: 'The Insider' },
      { x: 0.51, y: 0.52, w: 0.225, h: 0.42, role: 'The Boss' },
      { x: 0.755, y: 0.52, w: 0.225, h: 0.42, role: 'The Courier' },
    ],
    titleY: 0.46,
    popout: { x: 0.06, y: 0.52, w: 0.88, h: 0.40 },
  },
  'tilted-stack': {
    name: 'Tilted Stack',
    blurb: 'Five snapshots, slightly askew',
    panels: [
      { x: 0.03, y: 0.05, w: 0.57, h: 0.55, rot: -1.2, role: 'The Driver' },
      { x: 0.63, y: 0.04, w: 0.34, h: 0.26, rot: 1.0, role: 'The Insider' },
      { x: 0.63, y: 0.32, w: 0.34, h: 0.26, rot: -0.8, role: 'The Boss' },
      { x: 0.04, y: 0.63, w: 0.44, h: 0.31, rot: 0.8, role: 'The Rider' },
      { x: 0.52, y: 0.63, w: 0.44, h: 0.31, rot: -1.2, role: 'The Courier' },
    ],
    titleY: 0.52,
    popout: { x: 0.06, y: 0.60, w: 0.88, h: 0.32 },
  },
};

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#2b1245,#ff5e3a 55%,#ffb62e)',
    stops: [[0, '#1c0f2e'], [0.35, '#7a1e5e'], [0.6, '#ff5e3a'], [0.85, '#ffb62e'], [1, '#fff3dd']],
    amount: 0.55,
  },
  neon: {
    name: 'Neon Nights',
    swatch: 'linear-gradient(135deg,#0a0a24,#ff2e88 55%,#00c2a8)',
    stops: [[0, '#0a0a24'], [0.3, '#3b0f6e'], [0.55, '#ff2e88'], [0.8, '#00c2a8'], [1, '#e8fff9']],
    amount: 0.62,
  },
  golden: {
    name: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#241708,#e8862e 55%,#ffc46b)',
    stops: [[0, '#241708'], [0.35, '#8a4a12'], [0.6, '#e8862e'], [0.85, '#ffc46b'], [1, '#fff8e6']],
    amount: 0.5,
  },
  screenprint: {
    name: '1986 Vice Screenprint',
    swatch: 'repeating-linear-gradient(45deg,#fff3dd 0 4px,#ff2e88 4px 8px,#14100e 8px 12px)',
    stops: null,
    amount: 1,
  },
};

const POPOUT_PALETTES = {
  sunset: {
    sunTop: '#ffe9a8', sunBottom: '#ff5e3a', silhouette: '#1c0f24',
    car: '#ff2e88', carLine: '#7a1038', chrome: '#ffe9a8', glass: '#9fe8e0',
    seat: '#2b1245', light: '#fff3dd', tail: '#ff3b30', tire: '#14100e',
    wall: '#fff3dd', hub: '#ffb62e', shadow: '#ff2e88', lit: '#ffd76b',
  },
  neon: {
    sunTop: '#e8fff9', sunBottom: '#ff2e88', silhouette: '#0a0a24',
    car: '#00c2a8', carLine: '#045e52', chrome: '#e8fff9', glass: '#ffb62e',
    seat: '#3b0f6e', light: '#fff3dd', tail: '#ff3b30', tire: '#14100e',
    wall: '#fff3dd', hub: '#ff2e88', shadow: '#00c2a8', lit: '#00c2a8',
  },
  golden: {
    sunTop: '#fff8e6', sunBottom: '#e8862e', silhouette: '#241708',
    car: '#c22a2a', carLine: '#5e1208', chrome: '#ffe9a8', glass: '#ffe9a8',
    seat: '#4a2c08', light: '#fff3dd', tail: '#ff3b30', tire: '#14100e',
    wall: '#fff3dd', hub: '#ffb62e', shadow: '#e8862e', lit: '#ffd76b',
  },
  screenprint: {
    sunTop: '#fff3dd', sunBottom: '#ff5e3a', silhouette: '#14100e',
    car: '#ff2e88', carLine: '#14100e', chrome: '#fff3dd', glass: '#fff3dd',
    seat: '#14100e', light: '#fff3dd', tail: '#ff5e3a', tire: '#14100e',
    wall: '#fff3dd', hub: '#ffb62e', shadow: '#14100e', lit: '#ffb62e',
  },
};

const INKS = ['#fff3dd', '#ffb62e', '#ff5e3a', '#14100e'];

let grainCanvas = null;
function grainTile() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 140;
  grainCanvas.height = 140;
  const g = grainCanvas.getContext('2d');
  const img = g.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 120);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return grainCanvas;
}

const gradeCache = new Map();

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function gradientLut(stops) {
  const lut = [[], [], []];
  for (let v = 0; v < 256; v++) {
    const t = v / 255;
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const a = hexToRgb(c0);
    const b = hexToRgb(c1);
    lut[0][v] = a[0] + (b[0] - a[0]) * f;
    lut[1][v] = a[1] + (b[1] - a[1]) * f;
    lut[2][v] = a[2] + (b[2] - a[2]) * f;
  }
  return lut;
}

/**
 * Returns a graded copy of `img` (cached per photo + grade). Screenprint
 * posterizes the photo into four flat inks and screens it with halftone dots.
 */
export function gradedPhoto(photo, gradeKey, targetW = 900) {
  const key = `${photo.id}:${gradeKey}`;
  const hit = gradeCache.get(key);
  if (hit) return hit;
  const grade = GRADES[gradeKey];
  const iw = photo.img.naturalWidth || photo.img.width;
  const ih = photo.img.naturalHeight || photo.img.height;
  const scale = Math.min(1, targetW / iw);
  const w = Math.max(2, Math.round(iw * scale));
  const h = Math.max(2, Math.round(ih * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(photo.img, 0, 0, w, h);
  const imgData = g.getImageData(0, 0, w, h);
  const d = imgData.data;
  if (gradeKey === 'screenprint') {
    const inks = INKS.map(hexToRgb);
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
      const ink = lum > 0.78 ? inks[0] : lum > 0.52 ? inks[1] : lum > 0.30 ? inks[2] : inks[3];
      d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2];
    }
  } else {
    const lut = gradientLut(grade.stops);
    const amt = grade.amount;
    for (let i = 0; i < d.length; i += 4) {
      const lum = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      d[i] = d[i] * (1 - amt) + lut[0][lum] * amt;
      d[i + 1] = d[i + 1] * (1 - amt) + lut[1][lum] * amt;
      d[i + 2] = d[i + 2] * (1 - amt) + lut[2][lum] * amt;
    }
  }
  g.putImageData(imgData, 0, 0);
  if (gradeKey === 'screenprint') {
    g.globalAlpha = 0.20;
    g.fillStyle = g.createPattern(halftonePattern(6, '#14100e'), 'repeat');
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }
  gradeCache.set(key, c);
  return c;
}

/** Cover-fit draw of `img` into a panel rect, honouring focus point + zoom. */
function drawPanelPhoto(ctx, img, px, py, pw, ph, focus, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih);
  const s = base * zoom;
  const dw = iw * s;
  const dh = ih * s;
  let dx = px + pw / 2 - focus.fx * dw;
  let dy = py + ph / 2 - focus.fy * dh;
  dx = Math.min(px, Math.max(px + pw - dw, dx));
  dy = Math.min(py, Math.max(py + ph - dh, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBarcode(ctx, x, y, w, h, seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = (() => {
    let a = seed;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
  ctx.fillStyle = '#fff3dd';
  ctx.fillRect(x - w * 0.04, y - h * 0.12, w * 1.08, h * 1.35);
  ctx.fillStyle = '#14100e';
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.008 + rand() * 0.02);
    if (rand() > 0.42) ctx.fillRect(bx, y, bw, h);
    bx += bw + w * 0.008;
  }
}

function drawSeal(ctx, cx, cy, r, labelTop, labelBottom) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  ctx.beginPath();
  const spikes = 18;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i * Math.PI) / spikes;
    const rad = i % 2 === 0 ? r : r * 0.82;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffb62e';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#14100e';
  ctx.stroke();
  ctx.fillStyle = '#14100e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.30}px Anton, sans-serif`;
  ctx.fillText(labelTop, 0, -r * 0.18);
  ctx.fillText(labelBottom, 0, r * 0.18);
  drawStar(ctx, 0, r * 0.48, r * 0.09, '#14100e');
  ctx.restore();
}

function fitFont(ctx, text, fontFamily, startSize, maxWidth, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }
  return size;
}

/**
 * Renders the whole cover onto `canvas` at its own pixel size.
 * `state` is the editor state, `photos` a Map of id -> photo record.
 * Returns the canvas.
 */
export function renderCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = LAYOUTS[state.layout];
  const gradeKey = state.grade;
  const u = W / 1080; // unit: 1 at square export width

  // Backdrop: dusk gradient + a warm glow behind the title band.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b1245');
  bg.addColorStop(0.55, '#3d1535');
  bg.addColorStop(1, '#160b1e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * layout.titleY, 0, W / 2, H * layout.titleY, W * 0.55);
  glow.addColorStop(0, 'rgba(255, 46, 136, 0.30)');
  glow.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Panels.
  const gutter = Math.max(5, W * 0.008);
  layout.panels.forEach((panel, i) => {
    const slot = state.panels[i] || {};
    const photo = photos.get(slot.photoId);
    const px = panel.x * W;
    const py = panel.y * H;
    const pw = panel.w * W;
    const ph = panel.h * H;
    ctx.save();
    if (panel.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (photo) {
      const graded = gradedPhoto(photo, gradeKey);
      drawPanelPhoto(ctx, graded, 0, 0, pw, ph, { fx: slot.fx ?? 0.5, fy: slot.fy ?? 0.42 }, slot.zoom ?? 1.15);
    } else {
      const empty = ctx.createLinearGradient(0, 0, pw, ph);
      empty.addColorStop(0, '#4a2350');
      empty.addColorStop(1, '#241430');
      ctx.fillStyle = empty;
      ctx.fillRect(0, 0, pw, ph);
    }
    // Bottom shade so role tags stay readable.
    const shade = ctx.createLinearGradient(0, ph * 0.62, 0, ph);
    shade.addColorStop(0, 'rgba(10, 6, 16, 0)');
    shade.addColorStop(1, 'rgba(10, 6, 16, 0.55)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, pw, ph);
    ctx.restore();
    // Thick ink frame.
    ctx.save();
    if (panel.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    ctx.lineWidth = gutter;
    ctx.strokeStyle = '#14100e';
    ctx.strokeRect(0, 0, pw, ph);
    ctx.restore();
    // Role tag chip: panels whose foot the title band covers get their tag at
    // the top-left, clear of the lettering (and below the quote bar when the
    // panel starts at the very top). Every other tag is drawn after the
    // pop-out, so it sits on top of the art instead of under it.
    const role = slot.role || panel.role;
    if (role) {
      const fs = Math.max(11, 15 * u * (W >= H ? 1 : 1.05));
      ctx.font = `${fs}px Anton, sans-serif`;
      const tw = ctx.measureText(role.toUpperCase()).width;
      const chipX = px + gutter * 1.2;
      const chipW = tw + fs * 1.5;
      const chipH = fs * 1.9;
      const inTitleBand = (py + ph) > H * (layout.titleY - 0.10) && (py + ph) < H * (layout.titleY + 0.14);
      if (inTitleBand) {
        const chipY = py + gutter * 1.2 + (py < H * 0.02 ? H * 0.05 : 0);
        ctx.fillStyle = '#14100e';
        ctx.fillRect(chipX, chipY, chipW, chipH);
        ctx.fillStyle = '#ffb62e';
        ctx.fillRect(chipX, chipY, fs * 0.28, chipH);
        ctx.fillStyle = '#fff3dd';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(role.toUpperCase(), chipX + fs * 0.55, chipY + chipH / 2 + fs * 0.04);
      }
    }
    // Selected-panel outline for the editor preview.
    if (state.selected === i && state.showSelection) {
      ctx.save();
      ctx.strokeStyle = '#ffb62e';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([W * 0.014, W * 0.008]);
      ctx.strokeRect(px - gutter / 2, py - gutter / 2, pw + gutter, ph + gutter);
      ctx.restore();
    }
  });

  // Pop-out hero cut-out, breaking the panel borders around the title band.
  if (state.popout) {
    const z = layout.popout;
    drawPopoutGroup(ctx, W, H, { x: z.x * W, y: z.y * H, w: z.w * W, h: z.h * H }, state.popoutStyle, POPOUT_PALETTES[gradeKey]);
  }

  // Role tags for the panels the title band does not cover: bottom-left,
  // drawn over the pop-out art like a label stuck on the poster.
  layout.panels.forEach((panel, i) => {
    const slot = state.panels[i] || {};
    const role = slot.role || panel.role;
    if (!role) return;
    const px = panel.x * W;
    const py = panel.y * H;
    const pw = panel.w * W;
    const ph = panel.h * H;
    const inTitleBand = (py + ph) > H * (layout.titleY - 0.10) && (py + ph) < H * (layout.titleY + 0.14);
    if (inTitleBand) return;
    const fs = Math.max(11, 15 * u * (W >= H ? 1 : 1.05));
    ctx.font = `${fs}px Anton, sans-serif`;
    const tw = ctx.measureText(role.toUpperCase()).width;
    const chipX = px + gutter * 1.2;
    const chipW = tw + fs * 1.5;
    const chipH = fs * 1.9;
    const chipY = py + ph - gutter * 1.2 - chipH;
    ctx.fillStyle = '#14100e';
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.fillStyle = '#ffb62e';
    ctx.fillRect(chipX, chipY, fs * 0.28, chipH);
    ctx.fillStyle = '#fff3dd';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(role.toUpperCase(), chipX + fs * 0.55, chipY + chipH / 2 + fs * 0.04);
  });

  // Quote bar along the top.
  if (state.quote) {
    const qy = H * 0.028;
    const qfs = Math.max(11, 15 * u);
    ctx.textBaseline = 'middle';
    const starR = qfs * 0.55;
    let qx = W * 0.02;
    for (let s = 0; s < 5; s++) {
      drawStar(ctx, qx + starR, qy, starR, '#ffb62e');
      qx += starR * 2.5;
    }
    ctx.font = `${qfs}px Anton, sans-serif`;
    ctx.fillStyle = '#fff3dd';
    ctx.textAlign = 'left';
    const quoteText = `${state.quote.toUpperCase()}  —  ${state.source.toUpperCase()}`;
    ctx.fillText(quoteText, qx + qfs * 0.4, qy);
  }

  // Title block: chrome gradient title, script subtitle, tagline ribbon.
  const titleText = (state.title || 'VICE HEAT').toUpperCase();
  const titleTop = H * layout.titleY - H * 0.055;
  let titleSize = fitFont(ctx, titleText, 'Anton, sans-serif', W * 0.165, W * 0.96);
  try { ctx.letterSpacing = `${Math.round(titleSize * 0.01)}px`; } catch { /* older canvas */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const titleBaseline = titleTop + titleSize * 0.92;
  // Magenta offset shadow, then ink outline, then chrome fill.
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.fillStyle = gradeKey === 'screenprint' ? '#14100e' : 'rgba(255, 46, 136, 0.9)';
  ctx.fillText(titleText, W / 2 + titleSize * 0.035, titleBaseline + titleSize * 0.045);
  ctx.lineWidth = Math.max(3, titleSize * 0.055);
  ctx.strokeStyle = '#14100e';
  ctx.lineJoin = 'round';
  ctx.strokeText(titleText, W / 2, titleBaseline);
  const chrome = ctx.createLinearGradient(0, titleBaseline - titleSize, 0, titleBaseline);
  if (gradeKey === 'screenprint') {
    chrome.addColorStop(0, '#fff3dd');
    chrome.addColorStop(0.55, '#ffb62e');
    chrome.addColorStop(1, '#ff2e88');
  } else {
    chrome.addColorStop(0, '#fff8e6');
    chrome.addColorStop(0.35, '#ffc46b');
    chrome.addColorStop(0.62, '#ff7a3d');
    chrome.addColorStop(0.82, '#ff2e88');
    chrome.addColorStop(1, '#7b2ff7');
  }
  ctx.fillStyle = chrome;
  ctx.fillText(titleText, W / 2, titleBaseline);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  // Script subtitle, overlapping the title's foot.
  if (state.subtitle) {
    const subSize = titleSize * 0.40;
    ctx.save();
    ctx.translate(W * 0.56, titleBaseline + subSize * 0.42);
    ctx.rotate(-0.045);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.35;
    ctx.lineWidth = Math.max(2, subSize * 0.07);
    ctx.strokeStyle = '#14100e';
    ctx.lineJoin = 'round';
    ctx.strokeText(state.subtitle, 0, 0);
    ctx.fillStyle = gradeKey === 'screenprint' ? '#ff2e88' : '#ff7fb8';
    ctx.fillText(state.subtitle, 0, 0);
    ctx.restore();
  }

  // Tagline ribbon.
  if (state.tagline) {
    const tagFs = Math.max(11, 16 * u);
    ctx.font = `${tagFs}px Anton, sans-serif`;
    const tagText = state.tagline.toUpperCase();
    const tagW = Math.min(W * 0.86, ctx.measureText(tagText).width + tagFs * 3.2);
    const tagH = tagFs * 2.1;
    const tagX = (W - tagW) / 2;
    const tagY = titleBaseline + titleSize * 0.30;
    ctx.fillStyle = '#14100e';
    ctx.beginPath();
    ctx.moveTo(tagX, tagY);
    ctx.lineTo(tagX + tagW, tagY);
    ctx.lineTo(tagX + tagW - tagH * 0.4, tagY + tagH);
    ctx.lineTo(tagX + tagH * 0.4, tagY + tagH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3dd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, W / 2, tagY + tagH / 2 + tagFs * 0.04);
  }

  // Billing strip along the foot.
  const footY = H * 0.968;
  const footFs = Math.max(10, 13 * u);
  ctx.textBaseline = 'middle';
  if (state.comingSoon) {
    ctx.font = `${Math.max(13, 19 * u)}px Anton, sans-serif`;
    ctx.fillStyle = '#ff5fa8';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 12 * u;
    ctx.textAlign = 'left';
    ctx.fillText('COMING SOON', W * 0.02, footY);
    ctx.shadowBlur = 0;
  }
  ctx.font = `${footFs}px Anton, sans-serif`;
  ctx.fillStyle = '#e8d9bd';
  ctx.textAlign = 'center';
  ctx.fillText((state.billing || '').toUpperCase(), W * 0.5, footY);
  drawBarcode(ctx, W * 0.90, footY - footFs * 0.8, W * 0.075, footFs * 1.6, state.title || 'VICE HEAT');

  // Gold seal, top-right of the last panel row, clear of the pop-out car.
  drawSeal(ctx, W * 0.895, H * 0.615, W * 0.05, 'ORIGINAL', 'COVER ART');

  // Print finish: grain + vignette.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(10, 6, 16, 0)');
  vig.addColorStop(1, 'rgba(10, 6, 16, 0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  return canvas;
}

/** Renders a cover at full export size and returns the canvas. */
export function exportCanvas(state, photos, sizeKey) {
  const [w, h] = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, { ...state, showSelection: false }, photos);
  return canvas;
}
