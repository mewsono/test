import { useEffect, useRef } from 'react';

/**
 * A turntable does not stop dead. Speed approaches the target and, on pause,
 * bleeds off exponentially — that is the ease-out the record wants.
 */
export function useSpin(playing: boolean, degPerSec = 20) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let angle = 0;
    let vel = 0;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const target = playing ? degPerSec : 0;
      // spin up lazily, coast to a stop
      const k = 1 - Math.exp(-dt * (playing ? 1.6 : 2.1));
      vel += (target - vel) * k;
      if (!playing && Math.abs(vel) < 0.06) vel = 0;
      angle += vel * dt;
      if (angle > 360) angle -= 360;
      if (ref.current) ref.current.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, degPerSec]);

  return ref;
}
