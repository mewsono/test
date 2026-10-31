/* Shared domain types for the gallery. */

export type Tab = 'home' | 'explore' | 'saved' | 'profile';
export type ProfileTab = 'works' | 'liked' | 'following';
export type Category = 'All' | 'Landscape' | 'Illustration' | 'Sketch';
export type MoodKey = 'night' | 'dawn' | 'dusk' | 'water' | 'snow' | 'autumn';
export type SceneKey = 'gate' | 'pagoda' | 'koi' | 'snow' | 'sea' | 'bamboo';

export interface Artist {
  name: string;
  ini: string;
  /** Gradient stops used by the avatar ring. */
  g: string;
  fol: number;
}

export interface Artwork {
  id: number;
  t: string;
  by: string;
  sc: SceneKey;
  /** Palette key inside the scene. */
  pa: string;
  /** Cover aspect ratio (width / height). */
  r: number;
  cat: Category;
  mood: MoodKey;
  likes: number;
  views: number;
  date: string;
  tags: string[];
  d: string;
  /** Present for user posts: a data URL of the uploaded image. */
  img?: string;
}

export interface Prefs {
  saved: number[];
  liked: number[];
  follow: string[];
  accent: string;
  titles: boolean;
  grain: boolean;
  bio: string;
  /** Works posted from this device, saved so they survive a reload. */
  works: Artwork[];
}

export interface UiState {
  tab: Tab;
  cat: Category;
  mood: string;
  q: string;
  ptab: ProfileTab;
  editing: boolean;
  detail: number | null;
  file: string | null;
}

export interface Mood {
  k: MoodKey;
  n: string;
}
