import { ALL_TRACKS, PLAYLISTS, TRACK_BY_ID, type Track } from '../data/library';
import { usePlayer } from '../state/player';
import { Sleeve } from '../components/Sleeve';
import { TrackRow } from '../components/TrackRow';
import { Heart, PlaySmall, Shuffle } from '../components/Icons';
import { plural } from '../lib/format';

export function Lists() {
  const { liked, playPlaylist, playQueue, current, playing, toggleLike } = usePlayer();

  const likedTracks = ALL_TRACKS.filter((t) => liked[t.id]);

  return (
    <div className="screen lists">
      <header className="screen__head">
        <div>
          <div className="eyebrow">Kept behind the counter</div>
          <h1 className="screen__title serif">Your lists</h1>
        </div>
      </header>

      <div className="scroll lists__scroll">
        <section className="sect">
          <button
            type="button"
            className="liked-card glass"
            onClick={() =>
              likedTracks.length
                ? playQueue(likedTracks, 0)
                : playQueue(ALL_TRACKS.slice(0, 6), 0)
            }
          >
            <span className="liked-card__icon">
              <Heart size={22} filled />
            </span>
            <span className="liked-card__meta">
              <span className="liked-card__title">Liked songs</span>
              <span className="liked-card__sub">
                {likedTracks.length ? plural(likedTracks.length, 'track') : 'Tap the heart on anything'}
              </span>
            </span>
            <span className="liked-card__go">
              <PlaySmall size={18} />
            </span>
          </button>
        </section>

        <section className="sect">
          <div className="sect__head">
            <span className="eyebrow">Counter mixes</span>
            <span className="sect__count">{PLAYLISTS.length}</span>
          </div>
          <div className="mixes">
            {PLAYLISTS.map((p) => {
              const tracks = p.trackIds.map((id) => TRACK_BY_ID.get(id)).filter(Boolean) as Track[];
              return (
                <article key={p.id} className="mix">
                  <button
                    type="button"
                    className="mix__art"
                    onClick={() => playPlaylist(p)}
                    aria-label={`Play ${p.title}`}
                  >
                    <Sleeve
                      art={p.art}
                      size={112}
                      radius={0.12}
                      disc={{ size: 90, x: 28, y: -18, spinning: true, degPerSec: 26 }}
                    />
                    <span className="mix__play">
                      <PlaySmall size={16} />
                    </span>
                  </button>
                  <div className="mix__meta">
                    <span className="mix__title">{p.title}</span>
                    <span className="mix__sub">{p.blurb}</span>
                    <span className="mix__count">{plural(tracks.length, 'track')}</span>
                  </div>
                  <button
                    type="button"
                    className="mix__shuffle"
                    onClick={() => playQueue(tracks, Math.floor(Math.random() * tracks.length))}
                    aria-label={`Shuffle ${p.title}`}
                  >
                    <Shuffle size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {likedTracks.length ? (
          <section className="sect">
            <div className="sect__head">
              <span className="eyebrow">Heartmarked</span>
              <span className="sect__count">{likedTracks.length}</span>
            </div>
            <div className="rows">
              {likedTracks.map((t) => (
                <div key={t.id} className="liked-row">
                  <TrackRow
                    track={t}
                    showAlbum
                    active={current?.id === t.id}
                    playing={playing}
                    onPlay={() => playQueue(likedTracks, likedTracks.indexOf(t))}
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm is-liked"
                    onClick={() => toggleLike(t.id)}
                    aria-label={`Unlike ${t.title}`}
                  >
                    <Heart size={16} filled />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sect">
          <button
            type="button"
            className="everything glass"
            onClick={() => playQueue(ALL_TRACKS, Math.floor(Math.random() * ALL_TRACKS.length))}
          >
            <Shuffle size={18} />
            <span>Shuffle everything in the shop</span>
          </button>
        </section>
      </div>
    </div>
  );
}
