import { useMemo, useState } from 'react';
import {
  ALBUMS,
  ALBUM_BY_ID,
  ALL_TRACKS,
  NEW_ARRIVALS,
  PLAYLISTS,
  albumOf,
  type Album,
} from '../data/library';
import { greeting, plural } from '../lib/format';
import { usePlayer } from '../state/player';
import { AlbumCard } from '../components/AlbumCard';
import { TrackRow } from '../components/TrackRow';
import { Sleeve } from '../components/Sleeve';
import { ChevronRight } from '../components/Icons';

const FILTERS = ['Songs', 'Albums', 'Artists', 'Playlists'] as const;
type Filter = (typeof FILTERS)[number];

export function Home({
  onOpenAlbum,
  onSeeAlbums,
}: {
  onOpenAlbum: (album: Album) => void;
  onSeeAlbums: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('Songs');
  const { playTrack, playPlaylist, current, playing } = usePlayer();

  const recent = NEW_ARRIVALS.map((id) => ALBUM_BY_ID.get(id)!).filter(Boolean);

  const artists = useMemo(() => {
    const map = new Map<string, { name: string; albums: Album[] }>();
    ALBUMS.forEach((a) => {
      const entry = map.get(a.artist) ?? { name: a.artist, albums: [] };
      entry.albums.push(a);
      map.set(a.artist, entry);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <div className="screen home">
      <header className="home__head">
        <div>
          <div className="eyebrow">{greeting()}</div>
          <h1 className="home__title serif">Your music</h1>
        </div>
        <div className="wordmark" aria-label="yuri">
          yuri<span className="wordmark__dot" />
        </div>
      </header>

      <div className="chips" role="tablist" aria-label="Library filter">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`chip ${filter === f ? 'is-on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="scroll home__scroll">
        <section className="sect">
          <div className="sect__head">
            <span className="eyebrow">Recently added</span>
            <button type="button" className="link" onClick={onSeeAlbums}>
              See all
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="rail">
            {recent.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                size={148}
                variant="rail"
                onClick={() => onOpenAlbum(album)}
              />
            ))}
          </div>
        </section>

        {filter === 'Songs' ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">All songs</span>
              <span className="sect__count">{ALL_TRACKS.length}</span>
            </div>
            <div className="rows">
              {ALL_TRACKS.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  active={current?.id === t.id}
                  playing={playing}
                  showAlbum
                  onPlay={() => playTrack(t, ALL_TRACKS)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filter === 'Albums' ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Every sleeve in the shop</span>
              <span className="sect__count">{ALBUMS.length}</span>
            </div>
            <div className="rows">
              {ALBUMS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="save-row"
                  onClick={() => onOpenAlbum(a)}
                >
                  <Sleeve art={a.art} size={54} radius={0.18} lifted={false} />
                  <span className="save-row__meta">
                    <span className="save-row__title">{a.title}</span>
                    <span className="save-row__sub">
                      {a.artist} · {a.year}
                    </span>
                  </span>
                  <ChevronRight size={16} className="save-row__chev" />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {filter === 'Artists' ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Who pressed these</span>
              <span className="sect__count">{artists.length}</span>
            </div>
            <div className="rows">
              {artists.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  className="save-row"
                  onClick={() => onOpenAlbum(a.albums[0])}
                >
                  <span className="avatar" aria-hidden="true">
                    <Sleeve art={a.albums[0].art} size={54} radius={0.5} lifted={false} />
                  </span>
                  <span className="save-row__meta">
                    <span className="save-row__title">{a.name}</span>
                    <span className="save-row__sub">{plural(a.albums.length, 'album')}</span>
                  </span>
                  <ChevronRight size={16} className="save-row__chev" />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {filter === 'Playlists' ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Counter mixes</span>
              <span className="sect__count">{PLAYLISTS.length}</span>
            </div>
            <div className="rows">
              {PLAYLISTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="save-row"
                  onClick={() => playPlaylist(p)}
                >
                  <Sleeve art={p.art} size={54} radius={0.18} lifted={false} />
                  <span className="save-row__meta">
                    <span className="save-row__title">{p.title}</span>
                    <span className="save-row__sub">
                      {plural(p.trackIds.length, 'track')} · {p.blurb}
                    </span>
                  </span>
                  <ChevronRight size={16} className="save-row__chev" />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <p className="home__foot">
          {`Pressed in-house · ${ALBUMS.length} albums · ${ALL_TRACKS.length} tracks`}
          <br />
          {`Last sleeve filed: ${albumOf(ALL_TRACKS[ALL_TRACKS.length - 1]).title}`}
        </p>
      </div>
    </div>
  );
}
