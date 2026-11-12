import { useEffect, useMemo, useRef, useState } from 'react';
import { getEngine } from '../lib/engine';
import { usePlayer } from '../state/player';

const H = 30;
const LAMBDA = 18;
const AMP = 5.2;

function wavePath(width: number): string {
  const y = H / 2;
  const half = LAMBDA / 2;
  const start = -LAMBDA * 2;
  let d = `M ${start} ${y} q ${half / 2} ${-AMP * 2} ${half} 0`;
  const segments = Math.ceil((width - start + LAMBDA * 2) / half);
  for (let i = 0; i < segments; i++) d += ` t ${half} 0`;
  return d;
}

/**
 * The played part is a travelling sine; the rest is a flat line.
 * Amplitude follows the actual programme material.
 */
export function SeekBar() {
  const engine = useMemo(() => getEngine(), []);
  const { seek, playing } = usePlayer();
  const wrapRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const thumbRef = useRef<SVGCircleElement>(null);
  const dragging = useRef(false);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const d = useMemo(() => wavePath(width + LAMBDA * 2), [width]);
  const dRest = useMemo(() => `M 0 ${H / 2} H ${width}`, [width]);

  useEffect(() => {
    let raf = 0;
    let phase = 0;
    let smooth = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dur = engine.duration;
      const progress = dur > 0 ? Math.min(1, Math.max(0, engine.currentTime / dur)) : 0;
      const x = progress * width;
      clipRef.current?.setAttribute('width', String(x));
      thumbRef.current?.setAttribute('cx', String(x));

      if (playing) phase = (phase + dt * 46) % LAMBDA;
      const lv = engine.level();
      const target = playing ? Math.min(1, lv * 1.5) : 0;
      smooth += (target - smooth) * Math.min(1, dt * 9);
      const sy = 0.55 + smooth * 0.85;
      waveRef.current?.setAttribute(
        'transform',
        `translate(${-phase} 0) translate(0 ${H / 2}) scale(1 ${sy.toFixed(3)}) translate(0 ${-H / 2})`,
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine, playing, width]);

  const apply = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const dur = engine.duration;
    if (dur > 0) seek(p * dur);
  };

  return (
    <div
      className="seek"
      ref={wrapRef}
      role="slider"
      tabIndex={0}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(
        (engine.duration ? engine.currentTime / engine.duration : 0) * 100,
      )}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) apply(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          seek(engine.currentTime + 5);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          seek(engine.currentTime - 5);
        }
      }}
    >
      {width > 0 ? (
        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
          <defs>
            <clipPath id="yuri-played">
              <rect ref={clipRef} x={0} y={0} width={0} height={H} />
            </clipPath>
          </defs>
          <path d={dRest} className="seek__rest" />
          <g clipPath="url(#yuri-played)">
            <g ref={waveRef}>
              <path d={d} className="seek__wave" />
            </g>
          </g>
          <circle ref={thumbRef} cx={0} cy={H / 2} r={8} className="seek__thumb" />
        </svg>
      ) : null}
    </div>
  );
}
