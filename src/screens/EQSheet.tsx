import { useMemo, useRef, useState } from 'react';
import { EQ_FREQS, EQ_LABELS, getEngine } from '../lib/engine';

const MIN = -12;
const MAX = 12;

const PRESETS: { name: string; gains: number[] }[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Warm', gains: [3, 2, 0, -1, -2] },
  { name: 'Late', gains: [-2, 0, 2, 3, 1] },
  { name: 'Air', gains: [-1, 0, 1, 3, 5] },
];

export function EQSheet() {
  const engine = useMemo(() => getEngine(), []);
  const [bands, setBands] = useState<number[]>(() => engine.getBands());
  const dragging = useRef<number | null>(null);

  const setBand = (i: number, v: number) => {
    const value = Math.max(MIN, Math.min(MAX, v));
    engine.setBand(i, value);
    setBands((b) => b.map((x, idx) => (idx === i ? value : x)));
  };

  const fromEvent = (el: HTMLElement, clientY: number) => {
    const r = el.getBoundingClientRect();
    const t = 1 - (clientY - r.top) / r.height;
    return MIN + t * (MAX - MIN);
  };

  return (
    <div className="eq-sheet">
      <div className="eq-sheet__sliders">
        {EQ_FREQS.map((f, i) => {
          const v = bands[i] ?? 0;
          const pct = (v - MIN) / (MAX - MIN);
          return (
            <div className="eq-band" key={f}>
              <span className="eq-band__val tabular">{v > 0 ? `+${v.toFixed(0)}` : v.toFixed(0)}</span>
              <div
                className="eq-band__track"
                role="slider"
                tabIndex={0}
                aria-label={`${EQ_LABELS[i]} hertz`}
                aria-valuemin={MIN}
                aria-valuemax={MAX}
                aria-valuenow={Math.round(v)}
                onPointerDown={(e) => {
                  dragging.current = i;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setBand(i, fromEvent(e.currentTarget, e.clientY));
                }}
                onPointerMove={(e) => {
                  if (dragging.current === i) setBand(i, fromEvent(e.currentTarget, e.clientY));
                }}
                onPointerUp={(e) => {
                  dragging.current = null;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') setBand(i, v + 1);
                  if (e.key === 'ArrowDown') setBand(i, v - 1);
                }}
              >
                <span className="eq-band__zero" />
                <span
                  className="eq-band__fill"
                  style={{
                    height: `${Math.abs(v) / (MAX - MIN) * 100}%`,
                    bottom: v >= 0 ? '50%' : undefined,
                    top: v < 0 ? '50%' : undefined,
                  }}
                />
                <span className="eq-band__thumb" style={{ bottom: `calc(${pct * 100}% - 9px)` }} />
              </div>
              <span className="eq-band__label">{EQ_LABELS[i]}</span>
            </div>
          );
        })}
      </div>

      <div className="eq-sheet__presets">
        {PRESETS.map((p) => {
          const active = p.gains.every((g, i) => Math.abs(g - (bands[i] ?? 0)) < 0.5);
          return (
            <button
              key={p.name}
              type="button"
              className={`timer__opt ${active ? 'is-on' : ''}`}
              onClick={() => {
                p.gains.forEach((g, i) => setBand(i, g));
              }}
            >
              {p.name}
            </button>
          );
        })}
        <button
          type="button"
          className="timer__opt timer__opt--off"
          onClick={() => {
            engine.resetBands();
            setBands(EQ_FREQS.map(() => 0));
          }}
        >
          Reset
        </button>
      </div>

      <p className="eq-sheet__hint">Applied live to the record coming out of the speakers.</p>
    </div>
  );
}
