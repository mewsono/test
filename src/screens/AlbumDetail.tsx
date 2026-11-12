import type { Album } from '../data/library';
import { usePlayer } from '../state/player';
import { formatTime, formatTotal, plural } from '../lib/format';
import { Sleeve } from '../components/Sleeve';
import { ChevronLeft, Heart, Shuffle } from '../components/Icons';
import { Equalizer } from '../components/TrackRow';
import { useMeasure } from '../lib/useMeasure';

export function AlbumDetail({ album, onBack }: { album: Album; onBack: () => void }) {
  const { playAlbum, playTrack, current, playing, liked, toggleLike } = usePlayer();
  const { ref, width } = useMeasure<HTMLDivElement>();
  const art = width > 0 ? Math.min(232, width * 0.58) : 220;
  const total = album.tracks.reduce((s, t) => s + t.duration, 0);
  const likeKey = `album:${album.id}`;

  return (
    <div className="screen detail" ref={ref}>
      <header className="detail__bar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <span className="eyebrow">Sleeve</span>
        <button
          type="button"
          className={`icon-btn ${liked[likeKey] ? 'is-liked' : ''}`}
          onClick={() => toggleLike(likeKey)}
          aria-label={liked[likeKey] ? 'Remove from saved' : 'Save album'}
          aria-pressed={!!liked[likeKey]}
        >
          <Heart size={20} filled={!!liked[likeKey]} />
        </button>
      </header>

      <div className="scroll detail__scroll">
        <div className="detail__art">
          <Sleeve
            art={album.art}
            size={art}
            radius={0.1}
            tilt={-3}
            disc={{
              size: Math.round(art * 0.94),
              x: Math.round(art * 0.2),
              y: -Math.round(art * 0.16),
            }}
          />
        </div>

        <div className="detail__meta">
          <h1 className="detail__title serif">{album.title}</h1>
          <p className="detail__by">
            {album.artist} <span className="dot">·</span> {album.year}{' '}
            <span className="dot">·</span> {album.genre}
          </p>
          <p className="detail__stats">
            {plural(album.tracks.length, 'track')} · {formatTotal(total)}
          </p>
        </div>

        <div className="detail__actions">
          <button
            type="button"
            className="pill pill--cream"
            onClick={() => playAlbum(album)}
            aria-label={`Play ${album.title}`}
          >
            Play
          </button>
          <button
            type="button"
            className="pill pill--glass"
            onClick={() => playAlbum(album, Math.floor(Math.random() * album.tracks.length))}
          >
            <Shuffle size={18} />
            Shuffle
          </button>
        </div>

        <ol className="tracks">
          {album.tracks.map((t, i) => {
            const on = current?.id === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={`track ${on ? 'is-active' : ''}`}
                  onClick={() => playTrack(t, album.tracks)}
                  aria-label={`Play ${t.title}`}
                >
                  <span className="track__no tabular">
                    {on && playing ? <Equalizer /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="track__body">
                    <span className="track__title">{t.title}</span>
                    {t.note ? <span className="track__note">{t.note}</span> : null}
                  </span>
                  <span className="track__time tabular">{formatTime(t.duration)}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="notes glass">
          <span className="eyebrow">Sleeve notes</span>
          <p>{album.note}</p>
        </div>
      </div>
    </div>
  );
}
