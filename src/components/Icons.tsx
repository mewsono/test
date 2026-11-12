import type { SVGProps } from 'react';

type P = Omit<SVGProps<SVGSVGElement>, 'stroke'> & { size?: number };

function Svg({ size = 24, stroke = 1.7, children, ...rest }: P & { stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const ChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const Heart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z" />
  </Svg>
);

export const Shuffle = (p: P) => (
  <Svg {...p}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Svg>
);

export const Prev = (p: P) => (
  <Svg {...p}>
    <path d="M19 20L9 12l10-8zM5 19V5" />
  </Svg>
);

export const Next = (p: P) => (
  <Svg {...p}>
    <path d="M5 4l10 8-10 8zM19 5v14" />
  </Svg>
);

export const Play = ({ size = 24, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M7.5 4.2c0-1 1.1-1.6 1.9-1.1l11 7.8c.8.5.8 1.7 0 2.2l-11 7.8c-.8.5-1.9-.1-1.9-1.1z" />
  </svg>
);

export const Pause = ({ size = 24, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <rect x="6.5" y="4" width="4" height="16" rx="1.4" />
    <rect x="13.5" y="4" width="4" height="16" rx="1.4" />
  </svg>
);

export const Repeat = ({ one, ...p }: P & { one?: boolean }) => (
  <Svg {...p}>
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
    {one ? <path d="M12 10v4M11 11h2" strokeWidth={1.6} /> : null}
  </Svg>
);

export const Lyrics = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h10M4 18h13" />
  </Svg>
);

export const Queue = (p: P) => (
  <Svg {...p}>
    <path d="M3 6h13M3 12h13M3 18h9M19 15v6M16 18h6" />
  </Svg>
);

export const Sliders = (p: P) => (
  <Svg {...p}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </Svg>
);

export const Moon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
  </Svg>
);

export const Home = (p: P) => (
  <Svg {...p}>
    <path d="M3 11l9-8 9 8v10H3z" />
  </Svg>
);

export const Disc = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
  </Svg>
);

export const Search = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const List = (p: P) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Svg>
);

export const Close = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const PlaySmall = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </svg>
);

export const Basket = (p: P) => (
  <Svg {...p}>
    <path d="M3 9h18l-2 11H5zM8 9l3-6M16 9l-3-6" />
  </Svg>
);
