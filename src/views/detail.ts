import { ME, artist } from '../lib/data';
import { byArtist, likesOf, prefs, savesOf } from '../lib/store';
import { esc, fmt, has } from '../lib/util';
import { icon } from '../lib/icons';
import { artHTML, avatarRing, followBtn } from './partials';
import type { Artwork } from '../lib/types';

export function detailHTML(a: Artwork): string {
  const A = artist(a.by);
  const liked = has(prefs.liked, a.id);
  const saved = has(prefs.saved, a.id);
  const more = byArtist(a.by)
    .filter((x) => x.id !== a.id)
    .slice(0, 4);
  const kanji = a.id === 1 ? '<div class="kanji" aria-hidden="true">夜祭</div>' : '';

  return (
    `<div class="dhero">${artHTML(a)}<div class="shade"></div>` +
    `<button class="iconbtn glass dback" data-act="close" aria-label="Back">${icon('back')}</button>` +
    `<button class="iconbtn glass dmore" data-act="share" aria-label="Share">${icon('share', 20)}</button>` +
    kanji +
    `<div class="dtitle"><div class="dk">${esc(a.cat)}<span class="rule"></span><span class="d">${esc(a.date)}</span></div>` +
    `<h1>${esc(a.t)}</h1></div></div>` +
    `<div class="dbody">` +
    `<div class="arow" style="border:0;padding:0">${avatarRing(a.by, 46)}` +
    `<div class="info"><div class="nm">${esc(A.name)}</div>` +
    `<div class="muted">${a.by === ME ? 'You' : `${fmt(A.fol)} followers`}</div></div>` +
    (a.by === ME ? '' : followBtn(a.by)) +
    `</div>` +
    `<div class="dstats">` +
    `<div><b data-lkcount="${a.id}">${fmt(likesOf(a))}</b><span>Likes</span></div>` +
    `<div><b>${fmt(a.views)}</b><span>Views</span></div>` +
    `<div><b data-svcount="${a.id}">${fmt(savesOf(a))}</b><span>Saved</span></div>` +
    `</div>` +
    `<div class="tags">` +
    a.tags
      .map(
        (t) =>
          `<button class="tag" data-act="search" data-v="${esc(t)}"><i>#</i>${esc(t)}</button>`,
      )
      .join('') +
    `</div>` +
    (a.d ? `<p class="desc">${esc(a.d)}</p>` : '') +
    (more.length
      ? `<div><div class="secrow" style="margin-top:8px"><h2 class="sec">More from ${esc(A.name)}</h2></div>` +
        `<div class="scroller">` +
        more
          .map(
            (m) =>
              `<button class="arch" data-act="open" data-id="${m.id}" aria-label="Open ${esc(m.t)}" ` +
              `style="flex-basis:116px;height:170px">${artHTML(m)}<div class="shade"></div>` +
              `<div class="tx"><div class="t" style="font-size:13px">${esc(m.t)}</div></div></button>`,
          )
          .join('') +
        `</div></div>`
      : '') +
    `</div>` +
    `<div class="dbar">` +
    `<button class="primary like${liked ? ' on' : ''}" data-act="like" data-id="${a.id}" data-lk="${a.id}" aria-pressed="${liked}">${icon('heart', 20)}Like</button>` +
    `<button class="iconbtn${saved ? ' on' : ''}" data-act="save" data-id="${a.id}" data-sv="${a.id}" aria-pressed="${saved}" aria-label="Save">${icon('bookmark', 21)}</button>` +
    `<button class="iconbtn" data-act="share" aria-label="Share">${icon('share', 21)}</button>` +
    `</div><div class="dpad"></div>`
  );
}
