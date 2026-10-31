import './styles.css';
import { ME } from './lib/data';
import { addWork, nextId, persist, prefs, toggleFollow, toggleLiked, toggleSaved, byId } from './lib/store';
import { UI } from './lib/store';
import { $, $all, esc, fmt, has } from './lib/util';
import { icon } from './lib/icons';
import { toast } from './lib/toast';
import { hashArtwork, hashTab } from './lib/router';
import { homeGrid, homeView } from './views/home';
import { exploreBody, exploreView } from './views/explore';
import { savedView } from './views/saved';
import { profileView } from './views/profile';
import { detailHTML } from './views/detail';
import type { Artwork, Tab } from './lib/types';

const VIEWS: Record<Tab, () => string> = {
  home: homeView,
  explore: exploreView,
  saved: savedView,
  profile: profileView,
};

const NAV_ICONS = {
  home: 'home',
  explore: 'compass',
  saved: 'bookmark',
  profile: 'user',
} as const;

/* ---------- rendering ---------- */

function applyPrefs(): void {
  document.documentElement.style.setProperty('--accent', prefs.accent);
  document.body.classList.toggle('no-grain', !prefs.grain);
}

function renderNav(): void {
  $all('.nav [data-act=tab]').forEach((b) => {
    const v = b.dataset.v as Tab;
    b.innerHTML = icon(NAV_ICONS[v], 23);
    if (v === UI.tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const plus = $('.nav .plus');
  if (plus) plus.innerHTML = icon('plus', 24, 2.2);
}

function renderView(): void {
  const view = $('#view');
  if (!view) return;
  view.style.animation = 'none';
  void view.offsetHeight;
  view.style.animation = '';
  view.innerHTML = VIEWS[UI.tab]();
  renderNav();
}

/** The app scrolls inside .scroll, not the window, so keep that element in sync. */
function scroller(): HTMLElement | null {
  return document.getElementById('scroll');
}

function scrollToTop(): void {
  const sc = scroller();
  if (sc) sc.scrollTop = 0;
  else window.scrollTo(0, 0);
}

function renderKeepingScroll(): void {
  const y = scroller()?.scrollTop ?? window.scrollY;
  renderView();
  const sc = scroller();
  if (sc) sc.scrollTop = y;
  else window.scrollTo(0, y);
}

function syncStates(): void {
  $all('[data-sv]').forEach((b) => {
    const on = has(prefs.saved, Number(b.dataset.sv));
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  $all('[data-lk]').forEach((b) => {
    const on = has(prefs.liked, Number(b.dataset.lk));
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  $all('[data-fl]').forEach((b) => {
    const on = has(prefs.follow, b.dataset.fl as string);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Following' : 'Follow';
  });
  $all('[data-lkcount]').forEach((el) => {
    const a = byId(Number(el.dataset.lkcount));
    if (a) el.textContent = fmt(a.likes + (has(prefs.liked, a.id) ? 1 : 0));
  });
  $all('[data-svcount]').forEach((el) => {
    const a = byId(Number(el.dataset.svcount));
    if (a) el.textContent = fmt(Math.round(a.likes * 0.41) + (has(prefs.saved, a.id) ? 1 : 0));
  });
}

/* ---------- navigation ---------- */

function setTab(tab: Tab): void {
  if (location.hash.slice(1) === tab) {
    UI.tab = tab;
    hideDetail();
    renderView();
    scrollToTop();
  } else {
    location.hash = tab;
  }
}

function showDetail(id: number): void {
  const a = byId(id);
  if (!a) {
    hideDetail();
    return;
  }
  UI.detail = id;
  const sheet = $('#dsheet');
  if (!sheet) return;
  sheet.innerHTML = detailHTML(a);
  sheet.scrollTop = 0;
  const detail = $('#detail');
  if (detail) detail.hidden = false;
}

function hideDetail(): void {
  UI.detail = null;
  const detail = $('#detail');
  if (detail) detail.hidden = true;
}

function route(): void {
  const art = hashArtwork();
  if (art !== null) {
    showDetail(art);
    return;
  }
  hideDetail();
  const tab = hashTab();
  if (tab && tab !== UI.tab) {
    UI.tab = tab;
    renderView();
    scrollToTop();
  }
}

function closeDetail(): void {
  location.hash = UI.tab;
}

/* ---------- post sheet ---------- */

function openSheet(): void {
  UI.file = null;
  const file = $('#file') as HTMLInputElement | null;
  const title = $('#atitle') as HTMLInputElement | null;
  const post = $('#postBtn') as HTMLButtonElement | null;
  if (file) file.value = '';
  if (title) title.value = '';
  if (post) post.disabled = true;
  resetDrop();
  const sheet = $('#sheet');
  if (sheet) sheet.hidden = false;
  setTimeout(() => file?.focus(), 30);
}

function closeSheet(): void {
  const sheet = $('#sheet');
  if (sheet) sheet.hidden = true;
}

function resetDrop(): void {
  const drop = $('#drop');
  if (!drop) return;
  drop.innerHTML = `<span id="dropHint" style="display:grid;gap:8px;justify-items:center">${icon('image', 34, 1.4)}<span>Choose an image to post</span></span>`;
}

/* ---------- events ---------- */

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id ? Number(el.dataset.id) : null;
  const v = el.dataset.v;

  switch (act) {
    case 'tab':
      setTab(v as Tab);
      break;
    case 'open':
      location.hash = `art-${id}`;
      break;
    case 'close':
      closeDetail();
      break;
    case 'save': {
      if (id === null) break;
      const on = toggleSaved(id);
      persist();
      syncStates();
      toast(on ? 'Saved to your collection' : 'Removed from saved');
      if (UI.tab === 'saved' || UI.tab === 'profile') renderKeepingScroll();
      break;
    }
    case 'like': {
      if (id === null) break;
      const on = toggleLiked(id);
      persist();
      syncStates();
      if (on) toast('Liked');
      if (UI.tab === 'profile' && UI.ptab === 'liked' && !UI.detail) renderKeepingScroll();
      break;
    }
    case 'follow': {
      const name = el.dataset.id as string;
      const on = toggleFollow(name);
      persist();
      syncStates();
      toast(`${on ? 'Following' : 'Unfollowed'} ${name}`);
      if (UI.tab === 'profile') renderKeepingScroll();
      break;
    }
    case 'cat':
      UI.cat = v as typeof UI.cat;
      $all('[data-act=cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      $('#homeGrid')!.innerHTML = homeGrid();
      break;
    case 'mood':
      UI.mood = v as string;
      renderView();
      break;
    case 'search': {
      UI.q = v as string;
      if (UI.tab !== 'explore' || UI.detail) {
        if (location.hash.slice(1) === 'explore') {
          hideDetail();
          UI.tab = 'explore';
          renderView();
          scrollToTop();
        } else {
          location.hash = 'explore';
        }
      } else {
        ($('#q') as HTMLInputElement).value = UI.q;
        $('#clearQ')!.hidden = false;
        $('#exploreBody')!.innerHTML = exploreBody();
      }
      break;
    }
    case 'gosearch':
      UI.q = '';
      setTab('explore');
      setTimeout(() => ($('#q') as HTMLInputElement | null)?.focus(), 80);
      break;
    case 'clear': {
      UI.q = '';
      ($('#q') as HTMLInputElement).value = '';
      $('#clearQ')!.hidden = true;
      $('#exploreBody')!.innerHTML = exploreBody();
      ($('#q') as HTMLInputElement).focus();
      break;
    }
    case 'notif':
      toast('You are all caught up');
      break;
    case 'share':
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(location.href).then(
          () => toast('Link copied'),
          () => toast('Copy is blocked here. Use the address bar link.'),
        );
      } else {
        toast('Copy is blocked here. Use the address bar link.');
      }
      break;
    case 'ptab':
      UI.ptab = v as typeof UI.ptab;
      if (UI.tab !== 'profile') setTab('profile');
      else renderView();
      break;
    case 'editbio':
      UI.editing = true;
      renderView();
      setTimeout(() => $('#bioInput')?.focus(), 30);
      break;
    case 'savebio': {
      const input = $('#bioInput') as HTMLTextAreaElement | null;
      prefs.bio = input?.value.trim() || prefs.bio;
      persist();
      UI.editing = false;
      renderView();
      toast('Profile updated');
      break;
    }
    case 'cancelbio':
      UI.editing = false;
      renderView();
      break;
    case 'accent':
      prefs.accent = v as string;
      persist();
      applyPrefs();
      $all('[data-act=accent]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      break;
    case 'toggle': {
      const key = v as 'titles' | 'grain';
      prefs[key] = !prefs[key];
      persist();
      applyPrefs();
      el.setAttribute('aria-checked', String(prefs[key]));
      break;
    }
    case 'create':
      openSheet();
      break;
    case 'closesheet':
      closeSheet();
      break;
    case 'post': {
      if (!UI.file) break;
      const titleInput = $('#atitle') as HTMLInputElement | null;
      const work: Artwork = {
        id: nextId(),
        t: titleInput?.value.trim() || 'Untitled',
        by: ME,
        sc: 'gate',
        pa: 'night',
        r: 1,
        cat: 'Illustration',
        mood: 'night',
        likes: 0,
        views: 0,
        date: 'Today',
        tags: ['new'],
        d: '',
        img: UI.file,
      };
      addWork(work);
      const stored = persist();
      closeSheet();
      UI.ptab = 'works';
      toast(stored ? 'Posted to your profile' : 'Posted — reload will not keep this image');
      if (location.hash.slice(1) === 'profile' && !UI.detail) {
        UI.tab = 'profile';
        renderView();
      } else {
        location.hash = 'profile';
      }
      scrollToTop();
      break;
    }
  }
});

document.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.id === 'q') {
    UI.q = target.value;
    $('#clearQ')!.hidden = !UI.q;
    $('#exploreBody')!.innerHTML = exploreBody();
  }
  if (target.id === 'atitle') {
    ($('#postBtn') as HTMLButtonElement).disabled = !UI.file;
  }
});

document.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.id !== 'file') return;
  const file = target.files?.[0];
  if (!file) return;
  if (UI.file?.startsWith('blob:')) URL.revokeObjectURL(UI.file);
  UI.file = URL.createObjectURL(file);
  $('#drop')!.innerHTML = `<img src="${esc(UI.file)}" alt="Preview of the chosen image">`;
  ($('#postBtn') as HTMLButtonElement).disabled = false;
  const title = $('#atitle') as HTMLInputElement;
  if (!title.value) title.value = file.name.replace(/\.[^.]+$/, '').slice(0, 60);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#sheet')!.hidden) closeSheet();
  else if (UI.detail) closeDetail();
});

window.addEventListener('hashchange', route);

/* ---------- boot ---------- */

function setClock(): void {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  el.textContent = `${h}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function boot(): void {
  applyPrefs();
  setClock();
  window.setInterval(setClock, 30_000);
  const initial = hashTab();
  if (initial) UI.tab = initial;
  renderView();
  route();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
