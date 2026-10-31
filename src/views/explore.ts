import { ARTISTS, CHALLENGE, MOODS } from '../lib/data';
import { UI, byId, matchesQuery, trendingTags, works } from '../lib/store';
import { esc } from '../lib/util';
import { icon } from '../lib/icons';
import { artHTML, artistRow, avatarRing, empty, followBtn, masonry } from './partials';
import { PAL } from '../lib/palettes';
import { SCENES } from '../lib/scenes';

function results(q: string): string {
  const found = works.filter((a) => matchesQuery(a, q));
  const people = Object.keys(ARTISTS).filter((k) => `${ARTISTS[k].name} ${k}`.toLowerCase().includes(q));

  if (!found.length && !people.length) {
    return empty(
      `No matches for “${esc(UI.q.trim())}”`,
      'Try a tag like torii, koi or snow, or an artist name.',
      '<button class="primary" data-act="clear">Clear search</button>',
    );
  }

  return (
    (people.length
      ? `<div class="secrow"><h2 class="sec">Artists</h2><span class="muted">${people.length}</span></div>` +
        people.map(artistRow).join('')
      : '') +
    (found.length
      ? `<div class="secrow"><h2 class="sec">Works</h2><span class="muted">${found.length} found</span></div>` +
        masonry(found)
      : '')
  );
}

function browse(): string {
  const tags = trendingTags();
  const moods = MOODS.map((m) => {
    const list = works.filter((a) => a.mood === m.k);
    if (!list.length) return '';
    return (
      `<button class="mood" data-act="search" data-v="${m.k}" aria-label="${m.n}, ${list.length} works">` +
      artHTML(list[0]) +
      `<div class="shade"></div><div class="tx"><div class="t">${m.n}</div><div class="c">${list.length} works</div></div></button>`
    );
  }).join('');

  const people = Object.keys(ARTISTS)
    .map(
      (k) =>
        `<div class="artist">${avatarRing(k, 64)}<div class="nm">${esc(ARTISTS[k].name)}</div>${followBtn(k)}</div>`,
    )
    .join('');

  const challenge = byId(CHALLENGE.seedArtId);

  return (
    `<div class="secrow"><h2 class="sec">Browse by mood</h2></div><div class="scroller">${moods}</div>` +
    `<div class="secrow"><h2 class="sec">Trending tags</h2><span class="muted">This week</span></div>` +
    tags
      .map(
        (t, i) =>
          `<button class="trow" data-act="search" data-v="${esc(t.t)}">` +
          `<span class="n">0${i + 1}</span><span class="tg">#${esc(t.t)}</span>` +
          `<span class="muted">${t.n} works</span></button>`,
      )
      .join('') +
    `<div class="secrow"><h2 class="sec">Rising artists</h2></div><div class="scroller">${people}</div>` +
    `<div class="secrow"><h2 class="sec">Open challenge</h2></div>` +
    `<div class="contest">${challenge ? artHTML(challenge) : SCENES.sea(PAL.sea.sunset)}<div class="side"></div>` +
    `<div class="tx"><div class="pill" style="position:static">${CHALLENGE.left}</div><div>` +
    `<h3>${CHALLENGE.title.replace('\n', '<br>')}</h3>` +
    `<div class="muted" style="color:var(--soft);margin:4px 0 8px">${CHALLENGE.entries}</div></div></div></div>` +
    `<div style="margin-top:12px"><button class="primary" data-act="create">Enter the challenge</button></div>`
  );
}

export function exploreBody(): string {
  const q = UI.q.trim().toLowerCase();
  return q ? results(q) : browse();
}

export function exploreView(): string {
  return (
    `<header class="top"><div class="head" style="margin:0">` +
    `<div class="kicker">Find your next favorite</div><h1 class="page">Explore<i>.</i></h1></div></header>` +
    `<label class="search" for="q">${icon('search', 22)}` +
    `<input id="q" type="search" placeholder="Search tags, artists, works" value="${esc(UI.q)}" autocomplete="off">` +
    `<button data-act="clear" type="button" aria-label="Clear search" id="clearQ"${UI.q ? '' : ' hidden'}>${icon('x', 18)}</button>` +
    `</label>` +
    `<div id="exploreBody">${exploreBody()}</div>`
  );
}
