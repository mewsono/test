import { MOODS } from '../lib/data';
import { UI, savedWorks } from '../lib/store';
import { artHTML, empty, masonry } from './partials';

export function savedView(): string {
  const items = savedWorks();
  const moods = MOODS.filter((m) => items.some((a) => a.mood === m.k));

  if (UI.mood !== 'all' && !moods.some((m) => m.k === UI.mood)) UI.mood = 'all';
  const list = items.filter((a) => UI.mood === 'all' || a.mood === UI.mood);

  const head =
    `<header class="top"><div class="head" style="margin:0">` +
    `<div class="kicker">Your collection</div><h1 class="page">Saved<i>.</i></h1></div>` +
    `<div class="muted" style="padding-top:34px">${items.length} work${items.length === 1 ? '' : 's'}</div></header>`;

  if (!items.length) {
    return (
      head +
      empty(
        'Nothing saved yet',
        'Tap the bookmark on any artwork and it will show up here, grouped by mood.',
        '<button class="primary" data-act="tab" data-v="explore">Browse Explore</button>',
      )
    );
  }

  const collections =
    `<div class="coll-row" role="group" aria-label="Collections by mood">` +
    `<button class="coll all" data-act="mood" data-v="all" aria-pressed="${UI.mood === 'all'}">` +
    `<div class="tx" style="position:static;text-align:center"><div class="t">All</div>` +
    `<div class="c">${items.length} saved</div></div></button>` +
    moods
      .map((m) => {
        const list = items.filter((a) => a.mood === m.k);
        return (
          `<button class="coll" data-act="mood" data-v="${m.k}" aria-pressed="${UI.mood === m.k}">` +
          artHTML(list[0]) +
          `<div class="shade"></div><div class="tx"><div class="t">${m.n}</div>` +
          `<div class="c">${list.length} saved</div></div></button>`
        );
      })
      .join('') +
    `</div>`;

  return head + collections + `<div style="margin-top:18px">${masonry(list)}</div>`;
}
