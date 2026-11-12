import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlayer } from './state/player';
import { paletteFor, DEFAULT_PALETTE } from './lib/palette';
import { withAlpha } from './lib/color';
import type { Album, SectionId } from './data/library';

import { Mesh } from './components/Mesh';
import { NavBar } from './components/NavBar';
import { MiniPlayer } from './components/MiniPlayer';
import { Home } from './screens/Home';
import { Albums } from './screens/Albums';
import { AlbumDetail } from './screens/AlbumDetail';
import { Search } from './screens/Search';
import { Lists } from './screens/Lists';
import { NowPlaying } from './screens/NowPlaying';

export default function App() {
  const [section, setSection] = useState<SectionId>('home');
  const [detail, setDetail] = useState<Album | null>(null);
  const [detailOn, setDetailOn] = useState(false);
  const { album, nowPlayingOpen } = usePlayer();

  const palette = useMemo(() => (album ? paletteFor(album.art) : DEFAULT_PALETTE), [album]);

  /* the room takes its colour from whatever is on the turntable */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-soft', withAlpha(palette.accent, 0.42));
    root.style.setProperty('--deep', palette.deep);
  }, [palette]);

  const openAlbum = useCallback((a: Album) => {
    setDetail(a);
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailOn(true)));
  }, []);

  const closeAlbum = useCallback(() => {
    setDetailOn(false);
    window.setTimeout(() => setDetail(null), 420);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !nowPlayingOpen) closeAlbum();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, closeAlbum, nowPlayingOpen]);

  return (
    <div className="stage">
      <Mesh palette={palette} />
      <div className="haze" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className={`frame ${nowPlayingOpen ? 'is-now' : ''}`}>
        <div className="frame__scrim" aria-hidden="true" />

        <div className="screens" key={section}>
          {section === 'home' ? (
            <Home onOpenAlbum={openAlbum} onSeeAlbums={() => setSection('albums')} />
          ) : null}
          {section === 'albums' ? <Albums onOpenAlbum={openAlbum} /> : null}
          {section === 'search' ? <Search onOpenAlbum={openAlbum} /> : null}
          {section === 'lists' ? <Lists /> : null}
        </div>

        <div className={`overlay ${detailOn ? 'is-open' : ''}`} aria-hidden={!detailOn}>
          {detail ? <AlbumDetail album={detail} onBack={closeAlbum} /> : null}
        </div>

        <div className="chrome">
          <MiniPlayer />
          <NavBar
            active={section}
            onChange={(s) => {
              setSection(s);
              closeAlbum();
            }}
          />
        </div>

        <NowPlaying />
      </div>
    </div>
  );
}
