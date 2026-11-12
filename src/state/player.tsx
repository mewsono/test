import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ALBUMS,
  ALBUM_BY_ID,
  ALL_TRACKS,
  PLAYLIST_BY_ID,
  TRACK_BY_ID,
  albumOf,
  type Album,
  type Playlist,
  type Track,
} from '../data/library';
import { getEngine } from '../lib/engine';
import { coverUrl } from '../lib/cover';

export type Repeat = 'off' | 'all' | 'one';

type Persisted = {
  queueIds: string[];
  index: number;
  position: number;
  volume: number;
  shuffle: boolean;
  repeat: Repeat;
  liked: string[];
};

const KEY = 'yuri.v1';

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Persisted;
    return p ?? {};
  } catch {
    return {};
  }
}

type PlayerApi = {
  current: Track | null;
  album: Album | null;
  playing: boolean;
  shuffle: boolean;
  repeat: Repeat;
  volume: number;
  liked: Record<string, boolean>;
  queue: Track[];
  index: number;

  playTrack: (track: Track, queue?: Track[]) => void;
  playAlbum: (album: Album, startAt?: number) => void;
  playPlaylist: (playlist: Playlist) => void;
  playQueue: (tracks: Track[], startAt?: number) => void;

  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  nudge: (d: number) => void;

  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleLike: (id: string) => void;

  nowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;

  sleepEndsAt: number | null;
  setSleep: (minutes: number | null) => void;
};

export type Clock = {
  position: number;
  duration: number;
  sleepRemaining: number | null;
};

const PlayerCtx = createContext<PlayerApi | null>(null);
const ClockCtx = createContext<Clock>({ position: 0, duration: 0, sleepRemaining: null });

export function usePlayer(): PlayerApi {
  const v = useContext(PlayerCtx);
  if (!v) throw new Error('usePlayer outside PlayerProvider');
  return v;
}

export function useClock(): Clock {
  return useContext(ClockCtx);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => getEngine(), []);
  const saved = useMemo(() => loadPersisted(), []);

  const initialQueue = useMemo(() => {
    const ids = saved.queueIds ?? [];
    const tracks = ids.map((id) => TRACK_BY_ID.get(id)).filter(Boolean) as Track[];
    if (tracks.length) return tracks;
    return ALBUMS[0].tracks;
  }, [saved.queueIds]);

  const [queue, setQueue] = useState<Track[]>(initialQueue);
  const [index, setIndex] = useState(() => {
    const i = saved.index ?? 0;
    return i >= 0 && i < initialQueue.length ? i : 0;
  });
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(!!saved.shuffle);
  const [repeat, setRepeat] = useState<Repeat>(saved.repeat ?? 'off');
  const [volume, setVolumeState] = useState(saved.volume ?? 0.8);
  const [liked, setLiked] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    (saved.liked ?? []).forEach((id) => (o[id] = true));
    return o;
  });
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [position, setPosition] = useState(saved.position ?? 0);
  const [duration, setDuration] = useState(0);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);

  const current = queue[index] ?? null;
  const album = current ? albumOf(current) : null;

  const stateRef = useRef({ repeat, shuffle, index, queue });
  stateRef.current = { repeat, shuffle, index, queue };

  /* ---------------- the engine is the source of truth for playback ---- */
  const syncDuration = useCallback(() => {
    const d = engine.duration;
    if (d > 0) setDuration(d);
  }, [engine]);

  useEffect(() => {
    engine.setVolume(volume);
  }, [engine, volume]);

  /* first mount: load the record but stay paused until asked */
  useEffect(() => {
    if (!current) return;
    engine.load(current.src, false);
    const restore = Math.min(saved.position ?? 0, Math.max(0, current.duration - 1));
    if (restore > 0.5) {
      const onMeta = () => {
        engine.seek(restore);
        setPosition(restore);
        engine.audio.removeEventListener('loadedmetadata', onMeta);
      };
      engine.audio.addEventListener('loadedmetadata', onMeta);
      return () => engine.audio.removeEventListener('loadedmetadata', onMeta);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTrack = useCallback(
    (nextIndex: number, list: Track[], autoplay: boolean) => {
      setIndex(nextIndex);
      setPosition(0);
      const t = list[nextIndex];
      if (!t) return;
      engine.load(t.src, autoplay);
    },
    [engine],
  );

  const next = useCallback(() => {
    const { index: i, queue: q, repeat: r, shuffle: s } = stateRef.current;
    if (!q.length) return;
    if (r === 'one') {
      engine.seek(0);
      void engine.play();
      return;
    }
    let n: number;
    if (s && q.length > 1) {
      do {
        n = Math.floor(Math.random() * q.length);
      } while (n === i);
    } else {
      n = i + 1;
    }
    if (n >= q.length) {
      if (r === 'all') n = 0;
      else {
        engine.seek(0);
        engine.pause();
        setPlaying(false);
        return;
      }
    }
    changeTrack(n, q, true);
  }, [changeTrack, engine]);

  const prev = useCallback(() => {
    const { index: i, queue: q } = stateRef.current;
    if (engine.currentTime > 3) {
      engine.seek(0);
      return;
    }
    const n = i > 0 ? i - 1 : q.length - 1;
    changeTrack(n, q, true);
  }, [changeTrack, engine]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      const list = newQueue ?? stateRef.current.queue;
      const at = list.findIndex((t) => t.id === track.id);
      if (at === -1) {
        changeTrack(0, [track], true);
        setQueue([track]);
        return;
      }
      if (list !== stateRef.current.queue) setQueue(list);
      if (at === stateRef.current.index && list === stateRef.current.queue) {
        if (!engine.playing) void engine.play();
        return;
      }
      changeTrack(at, list, true);
    },
    [changeTrack, engine],
  );

  const playQueue = useCallback(
    (tracks: Track[], startAt = 0) => {
      if (!tracks.length) return;
      setQueue(tracks);
      changeTrack(startAt, tracks, true);
    },
    [changeTrack],
  );

  const playAlbum = useCallback(
    (a: Album, startAt = 0) => playQueue(a.tracks, startAt),
    [playQueue],
  );

  const playPlaylist = useCallback(
    (p: Playlist) => {
      const tracks = p.trackIds.map((id) => TRACK_BY_ID.get(id)).filter(Boolean) as Track[];
      playQueue(tracks, 0);
    },
    [playQueue],
  );

  const toggle = useCallback(() => {
    if (!current) return;
    void engine.toggle();
  }, [engine, current]);

  const seek = useCallback((t: number) => {
    engine.seek(t);
    setPosition(t);
  }, [engine]);

  const nudge = useCallback(
    (d: number) => {
      engine.nudge(d);
      setPosition(engine.currentTime);
    },
    [engine],
  );

  /* ---------------- engine events ---------------- */
  useEffect(() => {
    const unsub = engine.subscribe((e) => {
      if (e.type === 'playing') setPlaying(engine.playing);
      if (e.type === 'durationchange') syncDuration();
      if (e.type === 'time') {
        setPosition(engine.currentTime);
        syncDuration();
      }
      if (e.type === 'ended') next();
    });
    return unsub;
  }, [engine, next, syncDuration]);

  /* a light clock so the readouts move even when the browser is stingy
     with timeupdate (it fires ~4×/s, which is plenty for text) */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (engine.playing) setPosition(engine.currentTime);
      const d = engine.duration;
      if (d > 0 && Math.abs(d - duration) > 0.4) setDuration(d);
    }, 250);
    return () => window.clearInterval(id);
  }, [engine, duration]);

  /* ---------------- sleep timer ---------------- */
  const setSleep = useCallback((minutes: number | null) => {
    setSleepEndsAt(minutes ? Date.now() + minutes * 60_000 : null);
  }, []);

  const sleepRemaining = sleepEndsAt ? Math.max(0, sleepEndsAt - Date.now()) : null;

  useEffect(() => {
    if (!sleepEndsAt) return;
    const id = window.setInterval(() => {
      if (Date.now() >= sleepEndsAt) {
        engine.pause();
        setSleepEndsAt(null);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [engine, sleepEndsAt]);

  /* ---------------- persistence ---------------- */
  const likedKey = useMemo(() => Object.keys(liked).filter((k) => liked[k]).join(','), [liked]);
  const positionBucket = Math.round(position / 5);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const payload: Persisted = {
        queueIds: queue.map((t) => t.id),
        index,
        position,
        volume,
        shuffle,
        repeat,
        liked: likedKey ? likedKey.split(',') : [],
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(payload));
      } catch {
        /* private mode, no matter */
      }
    }, 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, index, positionBucket, volume, shuffle, repeat, likedKey]);

  /* ---------------- media session ---------------- */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current || !album) return;
    const art = coverUrl(album.art, 384);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: album.title,
      artwork: [
        { src: art, sizes: '384x384', type: 'image/jpeg' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => void engine.play());
    navigator.mediaSession.setActionHandler('pause', () => engine.pause());
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [current, album, engine, next, prev]);

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight' && e.shiftKey) next();
      else if (e.code === 'ArrowLeft' && e.shiftKey) prev();
      else if (e.code === 'ArrowRight') engine.nudge(5);
      else if (e.code === 'ArrowLeft') engine.nudge(-5);
      else if (e.code === 'Escape') setNowPlayingOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine, next, prev, toggle]);

  const api = useMemo<PlayerApi>(
    () => ({
      current,
      album,
      playing,
      shuffle,
      repeat,
      volume,
      liked,
      queue,
      index,
      playTrack,
      playAlbum,
      playPlaylist,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      nudge,
      toggleShuffle: () => setShuffle((s) => !s),
      cycleRepeat: () =>
        setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
      setVolume: (v: number) => {
        setVolumeState(v);
        engine.setVolume(v);
      },
      toggleLike: (id: string) => setLiked((l) => ({ ...l, [id]: !l[id] })),
      nowPlayingOpen,
      openNowPlaying: () => setNowPlayingOpen(true),
      closeNowPlaying: () => setNowPlayingOpen(false),
      sleepEndsAt,
      setSleep,
    }),
    [
      current,
      album,
      playing,
      shuffle,
      repeat,
      volume,
      liked,
      queue,
      index,
      playTrack,
      playAlbum,
      playPlaylist,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      nudge,
      engine,
      nowPlayingOpen,
      sleepEndsAt,
      setSleep,
    ],
  );

  const clock = useMemo<Clock>(
    () => ({ position, duration, sleepRemaining }),
    [position, duration, sleepRemaining],
  );

  return (
    <PlayerCtx.Provider value={api}>
      <ClockCtx.Provider value={clock}>{children}</ClockCtx.Provider>
    </PlayerCtx.Provider>
  );
}

/** everything a shuffle button is allowed to pick from */
export const EVERYTHING = ALL_TRACKS;
export const albumById = ALBUM_BY_ID;
export const playlistById = PLAYLIST_BY_ID;
