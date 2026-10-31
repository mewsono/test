import { ME, SEED_ART, artist } from './data';
import { flip, has } from './util';
import type { Artwork, Prefs, UiState } from './types';

const KEY = 'pixiv-gallery-v2';

export const DEFAULT_PREFS: Prefs = {
  saved: [1, 4, 6, 9],
  liked: [1, 2, 7],
  follow: ['mochi_rin', 'sorano'],
  accent: '#FF6B4A',
  titles: true,
  grain: true,
  bio: 'Collecting quiet night scenes. Anything with a lantern in it gets saved.',
  works: [],
};

export const UI: UiState = {
  tab: 'home',
  cat: 'All',
  mood: 'all',
  q: '',
  ptab: 'works',
  editing: false,
  detail: null,
  file: null,
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      saved: parsed.saved ?? DEFAULT_PREFS.saved.slice(),
      liked: parsed.liked ?? DEFAULT_PREFS.liked.slice(),
      follow: parsed.follow ?? DEFAULT_PREFS.follow.slice(),
      works: parsed.works ?? [],
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export const prefs: Prefs = readPrefs();

/** Seed works plus everything posted from this device. */
export const works: Artwork[] = [...prefs.works, ...SEED_ART];

export function byId(id: number): Artwork | undefined {
  return works.find((a) => a.id === id);
}

export function byArtist(id: string): Artwork[] {
  return works.filter((a) => a.by === id);
}

export function myWorks(): Artwork[] {
  return works.filter((a) => a.by === ME);
}

export function savedWorks(): Artwork[] {
  return prefs.saved.map(byId).filter((a): a is Artwork => Boolean(a));
}

export function likedWorks(): Artwork[] {
  return prefs.liked.map(byId).filter((a): a is Artwork => Boolean(a));
}

export function matchesQuery(a: Artwork, q: string): boolean {
  const haystack = [a.t, artist(a.by).name, a.by, a.cat, a.mood, ...a.tags].join(' ').toLowerCase();
  return haystack.includes(q);
}

export function trendingTags(limit = 5): Array<{ t: string; n: number; l: number }> {
  const map = new Map<string, { t: string; n: number; l: number }>();
  for (const a of works) {
    for (const tag of a.tags) {
      const cur = map.get(tag) ?? { t: tag, n: 0, l: 0 };
      cur.n += 1;
      cur.l += a.likes;
      map.set(tag, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.n - a.n || b.l - a.l).slice(0, limit);
}

export function likesOf(a: Artwork): number {
  return a.likes + (has(prefs.liked, a.id) ? 1 : 0);
}

export function savesOf(a: Artwork): number {
  return Math.round(a.likes * 0.41) + (has(prefs.saved, a.id) ? 1 : 0);
}

export function toggleSaved(id: number): boolean {
  return flip(prefs.saved, id, true);
}

export function toggleLiked(id: number): boolean {
  return flip(prefs.liked, id, true);
}

export function toggleFollow(id: string): boolean {
  return flip(prefs.follow, id);
}

/** Persist prefs + device works. Image data may blow the quota, so fall back. */
export function persist(): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...prefs, works: myWorks() }));
    return true;
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...prefs, works: [] }));
    } catch {
      /* storage unavailable: keep working in memory */
    }
    return false;
  }
}

/** Add a posted artwork to the top of the feed and remember it locally. */
export function addWork(work: Artwork): void {
  works.unshift(work);
  prefs.works = myWorks();
}

export function nextId(): number {
  return works.reduce((max, a) => Math.max(max, a.id), 1000) + 1;
}
