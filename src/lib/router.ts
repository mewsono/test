import { UI } from './store';
import type { Tab } from './types';

export const TABS: Tab[] = ['home', 'explore', 'saved', 'profile'];

export function isTab(value: string): value is Tab {
  return (TABS as string[]).includes(value);
}

export function hashTab(): Tab | null {
  const h = location.hash.slice(1);
  return isTab(h) ? h : null;
}

export function hashArtwork(): number | null {
  const m = /^art-(\d+)$/.exec(location.hash.slice(1));
  return m ? Number(m[1]) : null;
}

export function currentTab(): Tab {
  return hashTab() ?? UI.tab;
}
