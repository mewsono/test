import { useEffect, useRef, useState } from 'react';
import type { Palette } from '../lib/palette';

function blobs(colors: [string, string, string]) {
  return (
    <>
      {colors.map((c, i) => (
        <div
          key={`${i}-${c}`}
          className={`mesh__blob mesh__blob--${['a', 'b', 'c'][i]}`}
          style={{
            background: `radial-gradient(circle at 50% 45%, ${c} 0%, ${c} 28%, transparent 68%)`,
          }}
        />
      ))}
    </>
  );
}

/** Two stacked rooms; the new one fades in over the old as the record changes. */
export function Mesh({ palette }: { palette: Palette }) {
  const [slots, setSlots] = useState<[Palette, Palette]>([palette, palette]);
  const [active, setActive] = useState<0 | 1>(0);
  const last = useRef(palette);

  useEffect(() => {
    if (palette === last.current) return;
    last.current = palette;
    const target = active === 0 ? 1 : 0;
    setSlots((s) => {
      const next: [Palette, Palette] = [s[0], s[1]];
      next[target] = palette;
      return next;
    });
    setActive(target);
  }, [palette, active]);

  return (
    <>
      <div className={`mesh ${active === 0 ? 'is-on' : ''}`}>{blobs(slots[0].blobs)}</div>
      <div className={`mesh ${active === 1 ? 'is-on' : ''}`}>{blobs(slots[1].blobs)}</div>
    </>
  );
}
