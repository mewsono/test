import { useMemo, useState } from 'react';
import { ALBUMS, ALL_TRACKS, albumOf, type Album } from '../data/library';
import { usePlayer } from '../state/player';
import { Sleeve } from '../components/Sleeve';
import { TrackRow } from '../components/TrackRow';
import { Close, Search as SearchIcon } from '../components/Icons';

const SUGGESTIONS = ['Midnight', 'downtempo', 'Sable Coast', 'ambient', 'Ko', 'hazy'];

export function Search({ onOpenAlbum }: { onOpenAlbum: (album: Album) => void }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>(['Amber Static', 'Nova Gray']);
  const { playTrack, current, playing } = usePlayer();

  const query = q.trim().toLowerCase();

  const tracks = useMemo(() => {
    if (!query) return [];
    return ALL_TRACKS.filter((t) => {
      const a = albumOf(t);
      return (
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        a.title.toLowerCase().includes(query) ||
        a.genre.toLowerCase().includes(query)
      );
    });
  }, [query]);

  const albums = useMemo(() => {
    if (!query) return [];
    return ALBUMS.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.artist.toLowerCase().includes(query) ||
        a.genre.toLowerCase().includes(query) ||
        String(a.year).includes(query),
    );
  }, [query]);

  const remember = (term: string) => {
    setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 5));
  };

  const empty = query && tracks.length === 0 && albums.length === 0;

  return (
    <div className="screen search">
      <header className="screen__head">
        <div>
          <div className="eyebrow">Ask the counter</div>
          <h1 className="screen__title serif">Search</h1>
        </div>
      </header>

      <div className="search__field glass">
        <SearchIcon size={19} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => query && remember(q.trim())}
          placeholder="Songs, albums, artists"
          aria-label="Search the shop"
          autoComplete="off"
          spellCheck={false}
        />
        {q ? (
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => setQ('')} aria-label="Clear search">
            <Close size={16} />
          </button>
        ) : null}
      </div>

      <div className="scroll search__scroll">
        {!query ? (
          <>
            <section className="sect">
              <div className="sect__head">
                <span className="eyebrow">Recently asked</span>
              </div>
              <div className="chips chips--wrap">
                {recent.map((r) => (
                  <button key={r} type="button" className="chip" onClick={() => setQ(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </section>
            <section className="sect">
              <div className="sect__head">
                <span className="eyebrow">Try</span>
              </div>
              <div className="chips chips--wrap">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => setQ(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {empty ? (
          <p className="search__empty">
            Nothing on the shelves for “{q.trim()}”.
            <br />
            Try a mood instead — <button type="button" className="link" onClick={() => setQ('ambient')}>ambient</button>.
          </p>
        ) : null}

        {albums.length ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Sleeves</span>
              <span className="sect__count">{albums.length}</span>
            </div>
            <div className="rows">
              {albums.map((a) => (
                <button key={a.id} type="button" className="save-row" onClick={() => onOpenAlbum(a)}>
                  <Sleeve art={a.art} size={54} radius={0.18} lifted={false} />
                  <span className="save-row__meta">
                    <span className="save-row__title">{a.title}</span>
                    <span className="save-row__sub">
                      {a.artist} · {a.genre}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {tracks.length ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Tracks</span>
              <span className="sect__count">{tracks.length}</span>
            </div>
            <div className="rows">
              {tracks.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  showAlbum
                  active={current?.id === t.id}
                  playing={playing}
                  onPlay={() => playTrack(t, tracks)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
