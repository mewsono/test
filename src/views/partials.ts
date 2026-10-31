import { artist } from '../lib/data';
import { PAL } from '../lib/palettes';
import { SCENES } from '../lib/scenes';
import { has, esc, fmt } from '../lib/util';
import { byArtist, prefs } from '../lib/store';
import type { Artwork } from '../lib/types';
import { icon } from '../lib/icons';

/** Inline art for a work: the uploaded image, or a generated scene. */
export function artHTML(a: Artwork): string {
  if (a.img) return `<img class="art" src="${esc(a.img)}" alt="">`;
  const scene = SCENES[a.sc];
  const palettes = PAL[a.sc] as Record<string, unknown>;
  const palette = palettes[a.pa] ?? Object.values(palettes)[0];
  return scene(palette as never);
}

export function avatarRing(id: string, size: number): string {
  const A = artist(id);
  return (
    `<div class="ring" style="--s:${size}px;--g:linear-gradient(135deg,${A.g})"><i>${esc(A.ini)}</i></div>`
  );
}

export function card(a: Artwork): string {
  const A = artist(a.by);
  const on = has(prefs.saved, a.id);
  return (
    `<article class="card">` +
    `<button class="card-hit" data-act="open" data-id="${a.id}" aria-label="Open ${esc(a.t)} by ${esc(A.name)}">` +
    `<div class="cover" style="aspect-ratio:${a.r}">${artHTML(a)}</div>` +
    (prefs.titles
      ? `<div class="meta"><div class="t">${esc(a.t)}</div><div class="by">${esc(A.name)}</div></div>`
      : '') +
    `</button>` +
    `<button class="bm${on ? ' on' : ''}" data-act="save" data-id="${a.id}" data-sv="${a.id}" ` +
    `aria-pressed="${on}" aria-label="Save ${esc(a.t)}">${icon('bookmark', 20)}</button>` +
    `</article>`
  );
}

export function masonry(list: Artwork[]): string {
  const left: string[] = [];
  const right: string[] = [];
  list.forEach((a, i) => (i % 2 ? right : left).push(card(a)));
  return `<div class="masonry"><div class="col">${left.join('')}</div><div class="col">${right.join('')}</div></div>`;
}

export function followBtn(id: string): string {
  const on = has(prefs.follow, id);
  return (
    `<button class="fbtn" data-act="follow" data-id="${esc(id)}" data-fl="${esc(id)}" aria-pressed="${on}">` +
    `${on ? 'Following' : 'Follow'}</button>`
  );
}

export function empty(title: string, text: string, action = ''): string {
  return `<div class="empty">${icon('lantern', 44, 1.4)}<h3>${title}</h3><p>${text}</p>${action}</div>`;
}

export function artistRow(id: string): string {
  const count = byArtist(id).length;
  const A = artist(id);
  return (
    `<div class="arow">${avatarRing(id, 52)}<div class="info">` +
    `<div class="nm">${esc(A.name)}</div>` +
    `<div class="muted">${fmt(A.fol)} followers · ${count} works here</div></div>` +
    followBtn(id) +
    `</div>`
  );
}
