/**
 * Smoke test: boots the built HTML in jsdom, walks the main flows and fails on
 * uncaught page errors. Usage: node tools/smoke.js [path-to-html]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'index.html'));
let html = fs.readFileSync(file, 'utf8');

// jsdom cannot run ES modules, so inline the built bundle and drop the module tag.
const distDir = path.dirname(file);
html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, (m, src) => {
  const js = fs.readFileSync(path.join(distDir, src.replace(/^\//, '')), 'utf8');
  return `<script>${js}<\/script>`;
});
if (/<script type="module"/.test(html)) throw new Error('could not inline the built module');

// Same for the stylesheet: jsdom will not fetch it.
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (m, href) => {
  const css = fs.readFileSync(path.join(distDir, href.replace(/^\//, '')), 'utf8');
  return `<style>${css}</style>`;
});

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  // jsdom has no layout engine; scrolling is expected to be a no-op.
  if (/Not implemented: Window's scroll/.test(e.message)) return;
  errors.push(e.stack ? e.stack.split('\n').slice(0, 4).join(' / ') : e.message);
});

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
window.addEventListener('error', (e) => errors.push(e.error?.stack || e.message));

const click = (sel) => {
  const el = window.document.querySelector(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) errors.push(`assertion failed: ${label}`);
};

(async () => {
  await tick(200);
  const d = window.document;

  check('app shell mounted', !!d.querySelector('.app > .scroll > .shell > #view'));
  check('nav has 5 buttons', d.querySelectorAll('.nav button').length === 5);
  check('status bar clock set', /^\d{1,2}:\d{2}$/.test(d.getElementById('clock').textContent));
  check('home renders cards', d.querySelectorAll('.card').length === 14, `${d.querySelectorAll('.card').length}`);
  check('rising rail rendered', d.querySelectorAll('.arch').length === 7);
  check('hero art generated', (d.querySelector('.hero svg.art')?.outerHTML.length || 0) > 2000);
  check('theme tokens resolve', window.getComputedStyle(d.body).getPropertyValue('--paper').trim().length > 0);

  click('[data-act="cat"][data-v="Sketch"]');
  await tick();
  check('category filter narrows grid', d.querySelectorAll('#homeGrid .card').length > 0 && d.querySelectorAll('#homeGrid .card').length < 14, `${d.querySelectorAll('#homeGrid .card').length}`);

  const scroll = d.getElementById('scroll');
  scroll.scrollTop = 240;
  click('[data-act="tab"][data-v="explore"]');
  await tick(120);
  check('explore route applied', window.location.hash === '#explore');
  check('tab change resets the app scroller', scroll.scrollTop === 0, `top=${scroll.scrollTop}`);
  check('mood cards', d.querySelectorAll('.mood').length === 6);
  check('trending tags', d.querySelectorAll('.trow').length === 5);
  check('artists rail', d.querySelectorAll('.artist').length === 6);

  const q = d.querySelector('#q');
  q.value = 'koi';
  q.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  check('search filters works', d.querySelectorAll('#exploreBody .card').length === 2, `${d.querySelectorAll('#exploreBody .card').length}`);

  q.value = 'zzzz';
  q.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  check('empty search state', !!d.querySelector('#exploreBody .empty'));

  click('[data-act="tab"][data-v="saved"]');
  await tick(120);
  check('saved shows collections', d.querySelectorAll('.coll').length === 4);
  check('saved cards', d.querySelectorAll('.card').length === 4);

  click('[data-act="tab"][data-v="profile"]');
  await tick(120);
  check('profile tabs', d.querySelectorAll('.tab').length === 3);
  click('[data-act="ptab"][data-v="following"]');
  await tick();
  check('following list seeded', d.querySelectorAll('.arow').length === 2, `${d.querySelectorAll('.arow').length}`);

  click('.swatch[aria-pressed="false"]');
  await tick();
  check('accent applied', d.documentElement.style.getPropertyValue('--accent').startsWith('#'));
  click('[data-act="toggle"][data-v="grain"]');
  await tick();
  check('grain toggle', d.body.classList.contains('no-grain'));

  window.location.hash = '#art-5';
  await tick(120);
  check('detail opens from hash', d.getElementById('detail').hidden === false);
  check('detail title', d.querySelector('#dsheet h1')?.textContent === 'Harvest Moon Tide');
  click('[data-act="like"][data-lk="5"]');
  await tick();
  check('like marks artwork', d.querySelector('[data-act="like"][data-lk="5"]').classList.contains('on'));
  const storeKey = Object.keys(window.localStorage).find((k) => k.includes('pixiv'));
  const stored = storeKey && JSON.parse(window.localStorage.getItem(storeKey));
  check('like persisted', !!stored && stored.liked.includes(5), storeKey || 'no key');

  click('[data-act="close"]');
  await tick(120);
  check('detail closes', d.getElementById('detail').hidden === true);

  click('.plus');
  await tick();
  check('post sheet opens', d.getElementById('sheet').hidden === false);
  const post = d.getElementById('postBtn');
  check('post disabled without file', post.disabled === true);
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await tick();
  check('escape closes sheet', d.getElementById('sheet').hidden === true);

  await tick(100);
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log(errors.length ? `\n${errors.length} problem(s)` : '\nall good');
  process.exit(errors.length ? 1 : 0);
})().catch((e) => {
  console.error('smoke crashed:', e);
  process.exit(1);
});
