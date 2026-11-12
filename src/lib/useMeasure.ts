import { useEffect, useRef, useState } from 'react';

/** measure an element's width without laying out in a loop */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize((prev) =>
        Math.abs(prev.width - r.width) > 1 || Math.abs(prev.height - r.height) > 1
          ? { width: r.width, height: r.height }
          : prev,
      );
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ width: r.width, height: r.height });
    return () => ro.disconnect();
  }, []);
  return { ref, width: size.width, height: size.height };
}
