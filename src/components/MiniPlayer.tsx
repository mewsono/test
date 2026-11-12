import { useEffect, useMemo, useRef } from 'react';
import { getEngine } from '../lib/engine';
import { usePlayer } from '../state/player';
import { Sleeve } from './Sleeve';
import { Next, Pause, Play } from './Icons';

export function MiniPlayer() {
  const { current, album, playing, toggle, next, openNowPlaying } = usePlayer();
  const engine = useMemo(() => getEngine(), []);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = engine.duration;
      const p = d > 0 ? Math.min(1, engine.currentTime / d) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  if (!current || !album) return null;

  return (
    <div
      className="mini glass"
      role="button"
      tabIndex={0}
      aria-label={`Now playing: ${current.title} by ${current.artist}. Open player.`}
      onClick={openNowPlaying}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openNowPlaying();
        }
      }}
    >
      <Sleeve art={album.art} size={46} radius={0.22} lifted={false} />
      <div className="mini__meta">
        <span className="mini__title">{current.title}</span>
        <span className="mini__artist">{current.artist}</span>
      </div>
      <button
        type="button"
        className="mini__btn"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
      >
        {playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <button
        type="button"
        className="mini__btn"
        aria-label="Next track"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
      >
        <Next size={20} />
      </button>
      <div className="mini__track" aria-hidden="true">
        <div className="mini__bar" ref={barRef} />
      </div>
    </div>
  );
}
