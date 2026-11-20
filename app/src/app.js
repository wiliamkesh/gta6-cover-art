// Leonida Press editor: state, photo tray, layout and grade pickers, panel
// pan/zoom on the canvas, lettering fields, PNG export and the game-case view.
// A `?shot=` query sets up a fixed scene for screenshots (see shots.json).

import { LAYOUTS, GRADES, SIZES, renderCover, exportCanvas, gradedPhoto } from './cover.js';
import { findFocus } from './smartcrop.js';
import { makeVectorSample } from './vector.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const statusEl = $('status');

const query = new URLSearchParams(location.search);
const shotMode = query.get('shot');

const DEFAULT_ROLES = ['The Driver', 'The Insider', 'The Boss', 'The Rider', 'The Fixer', 'The Courier'];

const state = {
  size: '1080x1080',
  layout: 'vice-nine',
  grade: 'sunset',
  popout: true,
  popoutStyle: 'cruiser',
  title: 'VICE HEAT',
  subtitle: 'one last summer',
  tagline: 'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  quote: '“Pure golden-hour mayhem”',
  source: 'THE HARBOR GAZETTE',
  billing: 'A SUNSET PICTURES PRODUCTION · STARRING YOU',
  comingSoon: true,
  selected: 0,
  showSelection: true,
  fillAll: false,
  panels: DEFAULT_ROLES.map((role) => ({ photoId: null, zoom: 1.15, fx: 0.5, fy: 0.42, role })),
};

const photos = new Map();
let activePhotoId = null;
let renderQueued = false;
let caseDirty = true;

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function previewScale() {
  if (shotMode === 'cover') return 1;
  const [w, h] = SIZES[state.size];
  return Math.min(1, 560 / Math.max(w, h));
}

function renderPreview() {
  const [w, h] = SIZES[state.size];
  const s = previewScale();
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  renderCover(canvas, state, photos);
  caseDirty = true;
  if ($('case-toggle').checked) updateCase();
}

function updateCase() {
  if (!caseDirty) return;
  caseDirty = false;
  $('case-front').style.backgroundImage = `url(${canvas.toDataURL('image/jpeg', 0.85)})`;
}

/* ---------------- photo tray ---------------- */

function addPhotoRecord(id, img, name, kind) {
  photos.set(id, { id, img, name, kind });
  return photos.get(id);
}

function buildTray() {
  const tray = $('photo-tray');
  tray.innerHTML = '';
  for (const photo of photos.values()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tray-thumb' + (photo.id === activePhotoId ? ' is-active' : '');
    btn.dataset.photoId = photo.id;
    btn.title = photo.name;
    const thumb = photo.img instanceof HTMLCanvasElement ? photo.img : photo.img;
    if (thumb instanceof HTMLCanvasElement) {
      const c = document.createElement('canvas');
      c.width = 120; c.height = 120;
      c.getContext('2d').drawImage(thumb, 0, 0, 120, 120);
      btn.appendChild(c);
    } else {
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      btn.appendChild(img);
    }
    const label = document.createElement('span');
    label.textContent = photo.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      activePhotoId = photo.id;
      assignPhoto(photo.id);
      buildTray();
    });
    tray.appendChild(btn);
  }
}

function assignPhoto(photoId, slotIndex = state.selected) {
  const targets = state.fillAll ? state.panels.map((_, i) => i) : [slotIndex];
  for (const i of targets) {
    const slot = state.panels[i];
    slot.photoId = photoId;
    const photo = photos.get(photoId);
    if (photo) {
      const layout = LAYOUTS[state.layout];
      const panel = layout.panels[i];
      const aspect = panel ? panel.w / panel.h : 1;
      const focus = findFocus(photo.img, aspect);
      slot.fx = focus.fx;
      slot.fy = focus.fy;
      slot.zoom = 1.15;
    }
  }
  queueRender();
}

async function loadSamples() {
  const defs = [
    ['boulevard', 'samples/boulevard.jpg', 'Boulevard'],
    ['pier', 'samples/pier.jpg', 'Pier'],
  ];
  for (const [id, url, name] of defs) {
    if (!photos.has(id)) {
      try {
        addPhotoRecord(id, await loadImage(url), name, 'sample');
      } catch { /* sample missing: the tray just shows the rest */ }
    }
  }
  if (!photos.has('vector')) {
    addPhotoRecord('vector', makeVectorSample(), 'Studio vector', 'vector');
  }
  // Default casting: hero gets the boulevard, the rest alternate.
  const cast = ['boulevard', 'pier', 'vector', 'boulevard', 'pier', 'vector'];
  state.panels.forEach((slot, i) => {
    if (!slot.photoId && photos.has(cast[i])) slot.photoId = cast[i];
  });
  activePhotoId = state.panels[state.selected]?.photoId ?? 'boulevard';
  buildTray();
}

/** Points every panel's crop at the strongest face and detail in its photo. */
function smartCropAll() {
  const layout = LAYOUTS[state.layout];
  state.panels.forEach((slot, i) => {
    const photo = photos.get(slot.photoId);
    const panel = layout.panels[i];
    if (!photo || !panel) return;
    const focus = findFocus(photo.img, panel.w / panel.h);
    slot.fx = focus.fx;
    slot.fy = focus.fy;
    slot.zoom = 1.15;
  });
}

$('photo-upload').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const id = `upload-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      addPhotoRecord(id, img, file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Your photo', 'upload');
      activePhotoId = id;
      assignPhoto(id);
    } catch {
      setStatus(`Could not read ${file.name} as an image.`);
    }
  }
  buildTray();
  e.target.value = '';
});

$('fill-all').addEventListener('change', (e) => {
  state.fillAll = e.target.checked;
  if (state.fillAll && activePhotoId) assignPhoto(activePhotoId);
  setStatus(state.fillAll ? 'One photo fills every panel now.' : 'Panels take photos one at a time again.');
});

$('shuffle-photos').addEventListener('click', () => {
  const ids = [...photos.keys()];
  if (!ids.length) return;
  state.panels.forEach((slot) => {
    slot.photoId = ids[Math.floor(Math.random() * ids.length)];
  });
  queueRender();
  setStatus('Photos shuffled across the panels.');
});

$('sample-photos').addEventListener('click', async () => {
  await loadSamples();
  queueRender();
  setStatus('Sample photos loaded.');
});

/* ---------------- layout + grade pickers ---------------- */

function layoutSvg(id) {
  const layout = LAYOUTS[id];
  const rects = layout.panels.map((p) => {
    const rot = p.rot ? ` transform="rotate(${p.rot} 50 27)"` : '';
    return `<rect x="${p.x * 100}" y="${p.y * 54}" width="${p.w * 100}" height="${p.h * 54}" rx="1"${rot}/>`;
  }).join('');
  return `<svg viewBox="0 0 100 54" aria-hidden="true"><g fill="#3a2e24" stroke="#ffb62e" stroke-width="1.4">${rects}</g></svg>`;
}

function buildLayoutPicker() {
  const grid = $('layout-grid');
  grid.innerHTML = '';
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-card' + (state.layout === id ? ' is-on' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(state.layout === id));
    btn.innerHTML = `${layoutSvg(id)}<span>${layout.name} — ${layout.blurb}</span>`;
    btn.addEventListener('click', () => {
      state.layout = id;
      state.selected = 0;
      syncPanelTools();
      buildLayoutPicker();
      queueRender();
      setStatus(`Layout: ${layout.name}.`);
    });
    grid.appendChild(btn);
  }
}

function buildGradePicker() {
  const grid = $('grade-grid');
  grid.innerHTML = '';
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn' + (state.grade === id ? ' is-on' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(state.grade === id));
    btn.innerHTML = `<span class="grade-swatch" style="background:${grade.swatch}"></span><span>${grade.name}</span>`;
    btn.addEventListener('click', () => {
      state.grade = id;
      buildGradePicker();
      queueRender();
      setStatus(`Grade: ${grade.name}.`);
    });
    grid.appendChild(btn);
  }
}

$('popout-toggle').addEventListener('change', (e) => {
  state.popout = e.target.checked;
  queueRender();
});

document.querySelectorAll('.popout-style').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.popout-style').forEach((b) => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    state.popoutStyle = btn.dataset.style;
    queueRender();
    setStatus(`Pop-out art: ${btn.textContent}.`);
  });
});

/* ---------------- panel tools ---------------- */

function syncPanelTools() {
  const slot = state.panels[state.selected];
  const layout = LAYOUTS[state.layout];
  const panel = layout.panels[state.selected];
  $('selected-panel-label').textContent = `Panel ${state.selected + 1} · ${slot.role || panel?.role || 'Panel'}`;
  $('panel-zoom').value = String(slot.zoom);
  $('panel-role').value = slot.role || panel?.role || '';
}

$('panel-zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  queueRender();
});

$('panel-role').addEventListener('input', (e) => {
  state.panels[state.selected].role = e.target.value;
  queueRender();
});

$('panel-reset').addEventListener('click', () => {
  const slot = state.panels[state.selected];
  slot.zoom = 1.15;
  slot.fx = 0.5;
  slot.fy = 0.42;
  syncPanelTools();
  queueRender();
});

$('smart-crop').addEventListener('click', () => {
  const slot = state.panels[state.selected];
  const photo = photos.get(slot.photoId);
  if (!photo) {
    setStatus('Pick a photo for this panel first.');
    return;
  }
  const layout = LAYOUTS[state.layout];
  const panel = layout.panels[state.selected];
  const focus = findFocus(photo.img, panel.w / panel.h);
  slot.fx = focus.fx;
  slot.fy = focus.fy;
  slot.zoom = 1.15;
  syncPanelTools();
  queueRender();
  setStatus('Smart crop centred on the strongest face and detail in this photo.');
});

/* ---------------- canvas picking, pan, zoom ---------------- */

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const layout = LAYOUTS[state.layout];
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    let px = x;
    let py = y;
    if (p.rot) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const a = (-p.rot * Math.PI) / 180;
      const dx = x - cx;
      const dy = y - cy;
      px = cx + dx * Math.cos(a) - dy * Math.sin(a);
      py = cy + dx * Math.sin(a) + dy * Math.cos(a);
    }
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

let drag = null;

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit === -1) return;
  state.selected = hit;
  syncPanelTools();
  queueRender();
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, moved: false };
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const slot = state.panels[state.selected];
  const photo = photos.get(slot.photoId);
  if (!photo) return;
  const rect = canvas.getBoundingClientRect();
  const layout = LAYOUTS[state.layout];
  const panel = layout.panels[state.selected];
  const graded = gradedPhoto(photo, state.grade);
  const iw = graded.width;
  const ih = graded.height;
  const pw = panel.w * rect.width;
  const ph = panel.h * rect.height;
  const base = Math.max(pw / iw, ph / ih);
  const dw = iw * base * slot.zoom;
  const dh = ih * base * slot.zoom;
  slot.fx -= (e.clientX - drag.x) / dw;
  slot.fy -= (e.clientY - drag.y) / dh;
  slot.fx = Math.min(1, Math.max(0, slot.fx));
  slot.fy = Math.min(1, Math.max(0, slot.fy));
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.moved = true;
  queueRender();
});

canvas.addEventListener('pointerup', () => { drag = null; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[state.selected];
  slot.zoom = Math.min(2.6, Math.max(1, slot.zoom * Math.exp(-e.deltaY * 0.0012)));
  $('panel-zoom').value = String(slot.zoom);
  queueRender();
}, { passive: false });

canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  const photoId = e.dataTransfer.getData('text/photo-id');
  if (photoId && photos.has(photoId) && hit !== -1) {
    state.selected = hit;
    assignPhoto(photoId, hit);
    syncPanelTools();
    buildTray();
    return;
  }
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      const id = `upload-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      addPhotoRecord(id, img, file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Your photo', 'upload');
      activePhotoId = id;
      if (hit !== -1) {
        state.selected = hit;
        assignPhoto(id, hit);
      }
      buildTray();
      syncPanelTools();
    } catch {
      setStatus(`Could not read ${file.name} as an image.`);
    }
  }
});

/* ---------------- lettering ---------------- */

const fieldMap = [
  ['field-title', 'title'],
  ['field-subtitle', 'subtitle'],
  ['field-tagline', 'tagline'],
  ['field-quote', 'quote'],
  ['field-source', 'source'],
  ['field-billing', 'billing'],
];
for (const [id, key] of fieldMap) {
  $(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    queueRender();
  });
}
$('field-coming').addEventListener('change', (e) => {
  state.comingSoon = e.target.checked;
  queueRender();
});

/* ---------------- size + export ---------------- */

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    state.size = btn.dataset.size;
    queueRender();
    setStatus(`Post size: ${btn.textContent.trim()}.`);
  });
});

function downloadCanvas(exported, filename) {
  return new Promise((resolve) => {
    exported.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportOne(sizeKey) {
  const started = performance.now();
  const exported = exportCanvas(state, photos, sizeKey);
  const blob = await downloadCanvas(exported, `leonida-press-${sizeKey}.png`);
  const ms = Math.round(performance.now() - started);
  $('export-time').textContent = `Last export: ${sizeKey} PNG, ${(blob.size / 1024).toFixed(0)} KiB, rendered in ${ms} ms.`;
  setStatus(`Exported leonida-press-${sizeKey}.png in ${ms} ms.`);
  return { blob, ms };
}

$('export-png').addEventListener('click', () => exportOne(state.size));

$('export-all').addEventListener('click', async () => {
  const btn = $('export-all');
  btn.disabled = true;
  for (const sizeKey of Object.keys(SIZES)) {
    await exportOne(sizeKey);
    await new Promise((r) => setTimeout(r, 250));
  }
  btn.disabled = false;
  setStatus('All three sizes exported.');
});

/* ---------------- game case ---------------- */

$('case-toggle').addEventListener('change', (e) => {
  $('case-scene').hidden = !e.target.checked;
  if (e.target.checked) {
    caseDirty = true;
    updateCase();
  }
});

/* ---------------- shot mode ---------------- */

function applyShotParams() {
  if (query.get('layout') && LAYOUTS[query.get('layout')]) state.layout = query.get('layout');
  if (query.get('grade') && GRADES[query.get('grade')]) state.grade = query.get('grade');
  if (query.get('size') && SIZES[query.get('size')]) state.size = query.get('size');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('tagline')) state.tagline = query.get('tagline');
  if (query.get('quote')) state.quote = query.get('quote');
  if (query.get('popout') === 'off') state.popout = false;
  if (query.get('popout-style')) state.popoutStyle = query.get('popout-style');
  const photo = query.get('photo');
  if (photo) {
    const order = ['boulevard', 'pier', 'vector'];
    const start = order.indexOf(photo);
    state.panels.forEach((slot, i) => {
      slot.photoId = order[(start + i) % order.length];
    });
  }
  // Mirror the shot state into the controls so the editor shot shows it too.
  $('field-title').value = state.title;
  $('field-subtitle').value = state.subtitle;
  $('field-tagline').value = state.tagline;
  $('field-quote').value = state.quote;
  $('popout-toggle').checked = state.popout;
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.size === state.size));
  document.querySelectorAll('.popout-style').forEach((b) => b.classList.toggle('is-on', b.dataset.style === state.popoutStyle));
}

async function boot() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fonts fall back; the cover still renders */ }
  await loadSamples();
  buildLayoutPicker();
  buildGradePicker();
  buildTray();
  syncPanelTools();
  if (shotMode) {
    applyShotParams();
    buildLayoutPicker();
    buildGradePicker();
    smartCropAll();
    if (shotMode === 'cover') {
      document.body.classList.add('shot-cover');
      state.showSelection = false;
      const w = Number(query.get('w') || 1024);
      const h = Number(query.get('h') || 1024);
      const [ew, eh] = SIZES[state.size];
      const s = Math.min(w / ew, h / eh);
      canvas.width = Math.round(ew * s);
      canvas.height = Math.round(eh * s);
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      renderCover(canvas, state, photos);
    } else {
      renderPreview();
    }
  } else {
    smartCropAll();
    renderPreview();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

window.__leonida = {
  state,
  photos,
  renderPreview,
  exportOne,
  exportCanvas: (sizeKey) => exportCanvas(state, photos, sizeKey),
};

boot();
