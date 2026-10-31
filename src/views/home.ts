import { UI, byId, likesOf, prefs, works } from '../lib/store';
import { CATEGORIES, artist } from '../lib/data';
import { dayLabel, esc, has, fmt } from '../lib/util';
import { icon } from '../lib/icons';
import { artHTML, avatarRing, empty, masonry } from './partials';
import type { Artwork } from '../lib/types';

export function homeGrid(): string {
  const list = works.filter((a) => UI.cat === 'All' || a.cat === UI.cat);
  return list.length ? masonry(list) : empty('Nothing here yet', 'No works in this category.', '');
}

export function homeView(): string {
  const hero = byId(1) as Artwork;
  const A = artist(hero.by);
  const liked = has(prefs.liked, 1);
  const rising = works
    .filter((a) => a.id !== 1)
    .slice()
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 7);

  return (
    `<header class="top"><div class="wordmark">pixiv<i>.</i></div><div class="tools">` +
    `<button class="iconbtn" data-act="gosearch" aria-label="Search">${icon('search', 21)}</button>` +
    `<button class="iconbtn" data-act="notif" aria-label="Notifications">${icon('bell', 21)}<span class="pip"></span></button>` +
    `</div></header>` +
    `<div class="head"><div class="kicker">${dayLabel()} · Daily picks</div><h1 class="page sm">Tonight\u2019s gallery</h1></div>` +
    `<section class="hero" aria-label="Illustration of the day">` +
    artHTML(hero) +
    `<div class="shade"></div>` +
    `<button class="hit" data-act="open" data-id="1" aria-label="Open ${esc(hero.t)}"></button>` +
    `<div class="pill">Illustration of the day</div><div class="kanji" aria-hidden="true">夜祭</div>` +
    `<div class="hbot"><div><h2>${esc(hero.t)}</h2><div class="byline">` +
    avatarRing(hero.by, 26) +
    `${esc(A.name)}<span class="muted">· <span data-lkcount="1">${fmt(likesOf(hero))}</span> likes</span>` +
    `</div></div>` +
    `<button class="round like${liked ? ' on' : ''}" data-act="like" data-id="1" data-lk="1" aria-pressed="${liked}" aria-label="Like this artwork">${icon('heart', 22)}</button>` +
    `</div></section>` +
    `<div class="chips" role="group" aria-label="Filter by type">` +
    CATEGORIES.map(
      (c) =>
        `<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${UI.cat === c}">${c}</button>`,
    ).join('') +
    `</div>` +
    `<div class="secrow"><h2 class="sec">Rising tonight</h2><button class="link" data-act="tab" data-v="explore">See all</button></div>` +
    `<div class="arches">` +
    rising
      .map(
        (a, i) =>
          `<button class="arch" data-act="open" data-id="${a.id}" aria-label="Open ${esc(a.t)}">` +
          artHTML(a) +
          `<div class="shade"></div><div class="tx"><div class="n">0${i + 1}</div><div class="t">${esc(a.t)}</div></div></button>`,
      )
      .join('') +
    `</div>` +
    `<div class="secrow"><h2 class="sec">Picked for you</h2></div><div id="homeGrid">${homeGrid()}</div>`
  );
}
