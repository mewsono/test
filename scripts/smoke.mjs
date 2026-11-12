/**
 * yuri — render smoke test.
 *
 * There is no browser in this workshop, so we stand the whole app up inside
 * jsdom with just enough canvas / audio stubbed out to catch render-time
 * explosions, missing hooks and undefined paths.
 *
 *   node scripts/smoke.mjs
 */
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dom = new JSDOM(
  `<!doctype html><html><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost:5173/', pretendToBeVisual: true },
);

const { window } = dom;

/* ---- canvas: a context that shrugs ---- */
const gradient = () => ({ addColorStop() {} });
const ctx2d = () =>
  new Proxy(
    {
      canvas: { width: 300, height: 300 },
      createLinearGradient: gradient,
      createRadialGradient: gradient,
      createPattern: () => null,
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
      getImageData: (_x, _y, w, h) => ({
        data: new Uint8ClampedArray(w * h * 4).fill(120),
        width: w,
        height: h,
      }),
      putImageData() {},
      drawImage() {},
      measureText: () => ({ width: 10 }),
    },
    {
      get(t, k) {
        if (k in t) return t[k];
        return () => {};
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    },
  );

window.HTMLCanvasElement.prototype.getContext = function () {
  return ctx2d();
};
window.HTMLCanvasElement.prototype.toDataURL = function () {
  return 'data:image/png;base64,iVBORw0KGgo=';
};

/* ---- layout + observers ---- */
window.ResizeObserver = class {
  constructor(cb) {
    this.cb = cb;
  }
  observe(el) {
    const r = el.getBoundingClientRect?.() ?? { width: 390, height: 844 };
    this.cb([{ contentRect: { width: r.width || 390, height: r.height || 844 } }], this);
  }
  disconnect() {}
  unobserve() {}
};
window.Element.prototype.getBoundingClientRect = function () {
  return { width: 390, height: 844, top: 0, left: 0, right: 390, bottom: 844, x: 0, y: 0 };
};
window.Element.prototype.setPointerCapture = function () {};
window.Element.prototype.releasePointerCapture = function () {};
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} });

/* ---- audio ---- */
window.HTMLMediaElement.prototype.play = function () {
  this.paused = false;
  this.dispatchEvent(new window.Event('playing'));
  return Promise.resolve();
};
window.HTMLMediaElement.prototype.pause = function () {
  this.paused = true;
  this.dispatchEvent(new window.Event('pause'));
};
window.HTMLMediaElement.prototype.load = function () {};
Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
  configurable: true,
  get() {
    return 40;
  },
});

/* ---- expose to the app ---- */
const globals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLCanvasElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'ResizeObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle',
  'localStorage',
  'Audio',
  'Image',
  'MediaMetadata',
  'matchMedia',
];
for (const g of globals) {
  if (window[g] === undefined) continue;
  try {
    Object.defineProperty(globalThis, g, {
      value: window[g],
      configurable: true,
      writable: true,
    });
  } catch {
    /* node insists on its own navigator; let it */
  }
}

const errors = [];
let failed_interactions = 0;
window.addEventListener('error', (e) => errors.push(e.message));
const origError = console.error;
console.error = (...args) => {
  errors.push(args.map(String).join(' '));
  origError(...args);
};

/* ---- bundle the app ---- */
const outdir = path.join(ROOT, 'node_modules/.smoke');
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  outdir,
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'error',
  loader: { '.css': 'empty' },
  external: [],
});

const entry = path.join(outdir, 'main.js');
await import(`file://${entry}?t=${Date.now()}`);
await new Promise((r) => setTimeout(r, 400));

const root = window.document.getElementById('root');
const text = root.textContent ?? '';
const html = root.innerHTML ?? '';

/* ---------------- drive the thing ---------------- */
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const click = async (el, label) => {
  if (!el) {
    errors.push(`could not find: ${label}`);
    return false;
  }
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await wait(160);
  return true;
};
const byLabel = (needle) =>
  [...window.document.querySelectorAll('button, [role="button"]')].find((b) =>
    (b.getAttribute('aria-label') ?? '').toLowerCase().includes(needle.toLowerCase()),
  );
const byText = (needle) =>
  [...window.document.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').toLowerCase().includes(needle.toLowerCase()),
  );

const steps = [];
const step = async (name, fn) => {
  const before = errors.length;
  await fn();
  steps.push([name, errors.length === before ? null : errors.slice(before).join(' | ')]);
};

await step('open Albums', async () => {
  await click(byLabel('albums'), 'nav albums');
});
await step('open a sleeve', async () => {
  await click(byLabel('open midnight drive'), 'album card');
});
await step('close sleeve', async () => {
  await click(byLabel('back'), 'back');
});
await step('open Search', async () => {
  await click(byLabel('search'), 'nav search');
});
await step('type a query', async () => {
  const input = window.document.querySelector('.search__field input');
  if (!input) {
    errors.push('search input missing');
    return;
  }
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, 'midnight');
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await wait(200);
  const t = root.textContent ?? '';
  if (!/Chrome Rain|Midnight Drive/.test(t)) errors.push('search returned nothing for "midnight"');
});
await step('open Lists', async () => {
  await click(byLabel('lists'), 'nav lists');
});
await step('open Now Playing', async () => {
  await click(byLabel('open player'), 'mini player');
});
await step('press play', async () => {
  await click(byLabel('play'), 'play button');
});
await step('open queue sheet', async () => {
  await click(byText('queue'), 'queue chip');
});
await step('open eq sheet', async () => {
  await click(byText('eq'), 'eq chip');
});
await step('open timer sheet', async () => {
  await click(byText('timer'), 'timer chip');
  await click(byText('25 min') ?? byText('15 min'), 'timer option');
});
await step('next track', async () => {
  await click(byLabel('next track'), 'next');
});

const after = window.document.getElementById('root');
const afterHtml = after.innerHTML ?? '';
const nowOpen = /now is-open/.test(afterHtml) || after.querySelector('.now.is-open') !== null;

console.log('\n  interactions:');
for (const [name, err] of steps) {
  console.log(`  ${err ? 'FAIL' : 'ok  '} ${name}${err ? ` — ${err.slice(0, 160)}` : ''}`);
  if (err) failed_interactions++;
}

const checks = [
  ['renders a screen', html.length > 500],
  ['greeting', /good (morning|afternoon|evening)|after hours|still up/i.test(text)],
  ['wordmark', text.includes('yuri')],
  ['library title', text.includes('Your music')],
  ['songs list', html.includes('Chrome Rain') || /Twelve|Aperture|Sea Glass/.test(text)],
  ['nav present', html.includes('Semi') || html.includes('Home')],
  ['two mesh layers', (html.match(/mesh__blob/g) ?? []).length >= 6],
  ['grain layer', html.includes('grain')],
  ['artwork data url', html.includes('data:image/png')],
  ['now playing overlay opened', nowOpen],
  ['no recorded errors', errors.length === 0],
  ['no failed interactions', failed_interactions === 0],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`  ok   ${name}`);
  else {
    failed++;
    console.log(`  FAIL ${name}`);
  }
}

if (errors.length) {
  console.log('\nfirst errors:');
  errors.slice(0, 8).forEach((e) => console.log('  •', e.slice(0, 300)));
}

if (fs.existsSync(path.join(outdir, 'main.css'))) {
  console.log('\n(stylesheet extracted separately — loaders skip it here)');
}

console.log(failed === 0 ? '\nall good' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
