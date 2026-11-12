import { useEffect, useState } from 'react';
import { useClock, usePlayer } from '../state/player';
import { useMeasure } from '../lib/useMeasure';
import { formatTime } from '../lib/format';
import { Vinyl } from '../components/Vinyl';
import { Sleeve } from '../components/Sleeve';
import { SeekBar } from '../components/SeekBar';
import { Sheet } from '../components/Sheet';
import { EQSheet } from './EQSheet';
import {
  ChevronDown,
  Heart,
  Lyrics,
  Moon,
  Next,
  Pause,
  Play,
  Prev,
  Queue,
  Repeat,
  Shuffle,
  Sliders,
} from '../components/Icons';

type Panel = 'lyrics' | 'queue' | 'eq' | 'timer' | null;

export function NowPlaying() {
  const {
    current,
    album,
    playing,
    toggle,
    next,
    prev,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    liked,
    toggleLike,
    queue,
    index,
    nowPlayingOpen,
    closeNowPlaying,
    playQueue,
    sleepEndsAt,
    setSleep,
  } = usePlayer();
  const { position, duration, sleepRemaining } = useClock();
  const { ref, width, height } = useMeasure<HTMLDivElement>();
  const [panel, setPanel] = useState<Panel>(null);

  /* while the player is down, keep its controls out of the tab order */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    (el as HTMLElement & { inert: boolean }).inert = !nowPlayingOpen;
  }, [nowPlayingOpen, ref]);

  const disc =
    width > 0 ? Math.round(Math.min(width * 0.84, Math.max(210, height * 0.4), 336)) : 320;
  const sleeve = Math.round(disc * 0.58);

  if (!current || !album) return null;

  const isLiked = !!liked[current.id];

  return (
    <div className={`now ${nowPlayingOpen ? 'is-open' : ''}`} ref={ref} aria-hidden={!nowPlayingOpen}>
      <div className="now__inner">
      <header className="now__bar">
        <button type="button" className="icon-btn" onClick={closeNowPlaying} aria-label="Close player">
          <ChevronDown size={24} />
        </button>
        <span className="eyebrow now__from">Playing from {album.title}</span>
        <button
          type="button"
          className={`icon-btn ${isLiked ? 'is-liked' : ''}`}
          onClick={() => toggleLike(current.id)}
          aria-label={isLiked ? 'Remove from liked' : 'Like this track'}
          aria-pressed={isLiked}
        >
          <Heart size={22} filled={isLiked} />
        </button>
      </header>

      <div className="now__stage" style={{ height: Math.round(disc * 1.06) }}>
        <div
          className="now__disc"
          style={{ width: disc, height: disc, transform: `translateX(-50%) rotate(14deg)` }}
        >
          <Vinyl
            size={disc}
            a={album.art.a}
            b={album.art.b}
            spinning={playing}
            degPerSec={17}
            glow={`${album.art.ink}22`}
          />
        </div>
        <div
          className="now__sleeve"
          style={{ width: sleeve, height: sleeve, top: Math.round(disc * 0.45) }}
        >
          <Sleeve art={album.art} size={sleeve} radius={0.1} />
        </div>
      </div>

      <div className="now__head">
        <h1 className="now__title serif">{current.title}</h1>
        <p className="now__by">
          {current.artist} <span className="dot">·</span> {album.genre}{' '}
          <span className="dot">·</span> {album.year}
        </p>
      </div>

      <div className="now__seek">
        <SeekBar />
        <div className="now__times tabular">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration || current.duration)}</span>
        </div>
      </div>

      <div className="now__controls glass">
        <button
          type="button"
          className={`ctrl ${shuffle ? 'is-on' : ''}`}
          onClick={toggleShuffle}
          aria-label="Shuffle"
          aria-pressed={shuffle}
        >
          <Shuffle size={19} />
        </button>
        <button type="button" className="ctrl" onClick={prev} aria-label="Previous track">
          <Prev size={26} />
        </button>
        <button
          type="button"
          className="ctrl ctrl--play"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button type="button" className="ctrl" onClick={next} aria-label="Next track">
          <Next size={26} />
        </button>
        <button
          type="button"
          className={`ctrl ${repeat !== 'off' ? 'is-on' : ''}`}
          onClick={cycleRepeat}
          aria-label={`Repeat: ${repeat}`}
          aria-pressed={repeat !== 'off'}
        >
          <Repeat size={19} one={repeat === 'one'} />
        </button>
      </div>

      <div className="now__chips">
        <button type="button" className="chip chip--icon" onClick={() => setPanel('lyrics')}>
          <Lyrics size={17} />
          Lyrics
        </button>
        <button type="button" className="chip chip--icon" onClick={() => setPanel('queue')}>
          <Queue size={17} />
          Queue
        </button>
        <button type="button" className="chip chip--icon" onClick={() => setPanel('eq')}>
          <Sliders size={17} />
          EQ
        </button>
        <button
          type="button"
          className={`chip chip--icon ${sleepEndsAt ? 'is-on' : ''}`}
          onClick={() => setPanel('timer')}
        >
          <Moon size={17} />
          {sleepRemaining ? `${Math.ceil(sleepRemaining / 60000)}m` : 'Timer'}
        </button>
      </div>
      </div>

      <Sheet
        open={panel === 'lyrics'}
        onClose={() => setPanel(null)}
        eyebrow="Transcription"
        title="Lyrics"
      >
        <div className="lyrics">
          <p className="lyrics__none">No words on this one.</p>
          <p className="lyrics__note">{current.note ?? album.note}</p>
          <div className="lyrics__credits">
            <span className="eyebrow">Credits</span>
            <p>
              {current.artist} — written, played and taped after closing.
              <br />
              From <em>{album.title}</em>, {album.year}. Cut for yuri.
            </p>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={panel === 'queue'}
        onClose={() => setPanel(null)}
        eyebrow={`${queue.length} records`}
        title="Up next"
      >
        <ol className="queue">
          {queue.map((t, i) => {
            const on = i === index;
            return (
              <li key={`${t.id}-${i}`}>
                <button
                  type="button"
                  className={`queue__item ${on ? 'is-active' : ''}`}
                  onClick={() => {
                    playQueue(queue, i);
                    setPanel(null);
                  }}
                >
                  <span className="queue__no tabular">
                    {on ? (playing ? <span className="queue__pulse" /> : String(i + 1).padStart(2, '0')) : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="queue__body">
                    <span className="queue__title">{t.title}</span>
                    <span className="queue__sub">{t.artist}</span>
                  </span>
                  <span className="queue__time tabular">{formatTime(t.duration)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </Sheet>

      <Sheet open={panel === 'eq'} onClose={() => setPanel(null)} eyebrow="Tone" title="Equaliser">
        <EQSheet />
      </Sheet>

      <Sheet open={panel === 'timer'} onClose={() => setPanel(null)} eyebrow="Wind down" title="Sleep timer">
        <div className="timer">
          <p className="timer__hint">
            The record stops itself. Nothing worse than a shop left spinning.
          </p>
          <div className="timer__grid">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                className={`timer__opt ${sleepEndsAt && sleepRemaining && Math.abs(sleepRemaining - m * 60000) < 30000 ? 'is-on' : ''}`}
                onClick={() => setSleep(m)}
              >
                {m} min
              </button>
            ))}
            <button type="button" className="timer__opt timer__opt--off" onClick={() => setSleep(null)}>
              Off
            </button>
          </div>
          {sleepRemaining ? (
            <p className="timer__left">
              Stopping in <strong>{Math.ceil(sleepRemaining / 60000)} min</strong>
            </p>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}
