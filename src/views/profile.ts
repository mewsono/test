import { ACCENTS, ME, ME_ARTIST } from '../lib/data';
import { UI, likedWorks, myWorks, prefs } from '../lib/store';
import { esc } from '../lib/util';
import { artistRow, avatarRing, empty, masonry } from './partials';
import { bannerArt } from '../lib/scenes';

const PROFILE_TABS = [
  ['works', 'Works'],
  ['liked', 'Liked'],
  ['following', 'Following'],
] as const;

export function profileView(): string {
  const mine = myWorks();
  const liked = likedWorks();

  const body =
    UI.ptab === 'works'
      ? mine.length
        ? masonry(mine)
        : empty(
            'No works yet',
            'Post your first piece and it will appear here and on Home.',
            '<button class="primary" data-act="create">Post artwork</button>',
          )
      : UI.ptab === 'liked'
        ? liked.length
          ? masonry(liked)
          : empty('No likes yet', 'Works you like are collected here.', '')
        : prefs.follow.length
          ? prefs.follow.map(artistRow).join('')
          : empty(
              'Not following anyone',
              'Follow artists on Explore to see them here.',
              '<button class="primary" data-act="tab" data-v="explore">Find artists</button>',
            );

  const bio = UI.editing
    ? `<div style="margin-top:12px"><label class="sr" for="bioInput">Bio</label>` +
      `<textarea id="bioInput" maxlength="140">${esc(prefs.bio)}</textarea>` +
      `<div style="display:flex;gap:10px;margin-top:10px">` +
      `<button class="primary" data-act="savebio">Save</button>` +
      `<button class="fbtn" data-act="cancelbio">Cancel</button></div></div>`
    : `<p class="bio">${esc(prefs.bio)}</p>`;

  return (
    `<div class="banner">${bannerArt()}<div class="shade" style="height:50%"></div></div>` +
    `<div class="me">${avatarRing(ME, 84)}` +
    (UI.editing ? '' : '<button class="fbtn" data-act="editbio">Edit profile</button>') +
    `</div>` +
    `<h1 class="name">${esc(ME_ARTIST.name)}</h1><div class="muted" style="margin-top:2px">@${ME} · Joined 2026</div>` +
    bio +
    `<div class="stats">` +
    `<button class="stat" data-act="ptab" data-v="works"><b>${mine.length}</b><span>Works</span></button>` +
    `<button class="stat" data-act="ptab" data-v="following"><b>${prefs.follow.length}</b><span>Following</span></button>` +
    `<button class="stat" data-act="tab" data-v="saved"><b>${prefs.saved.length}</b><span>Saved</span></button>` +
    `</div>` +
    `<div class="tabs" role="tablist">` +
    PROFILE_TABS.map(
      ([key, label]) =>
        `<button class="tab" role="tab" data-act="ptab" data-v="${key}" aria-selected="${UI.ptab === key}">${label}</button>`,
    ).join('') +
    `</div><div class="tabbody" role="tabpanel">${body}</div>` +
    `<div class="secrow"><h2 class="sec">Appearance</h2></div>` +
    `<div class="row"><span class="lb" id="lbAcc">Accent color</span>` +
    `<div class="swatches" role="group" aria-labelledby="lbAcc">` +
    ACCENTS.map(
      ([color, name]) =>
        `<button class="swatch" data-act="accent" data-v="${color}" aria-pressed="${prefs.accent === color}" ` +
        `aria-label="${name}" style="--c:${color}"><i></i></button>`,
    ).join('') +
    `</div></div>` +
    `<div class="row"><span class="lb" id="lbTi">Show titles on cards</span>` +
    `<button class="sw" role="switch" data-act="toggle" data-v="titles" aria-checked="${prefs.titles}" aria-labelledby="lbTi"></button></div>` +
    `<div class="row"><span class="lb" id="lbGr">Film grain</span>` +
    `<button class="sw" role="switch" data-act="toggle" data-v="grain" aria-checked="${prefs.grain}" aria-labelledby="lbGr"></button></div>`
  );
}
