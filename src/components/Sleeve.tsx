import type { CSSProperties } from 'react';
import type { ArtRecipe } from '../data/library';
import { coverUrl } from '../lib/cover';
import { Vinyl } from './Vinyl';

type Disc = {
  size: number;
  x: number;
  y: number;
  spinning?: boolean;
  degPerSec?: number;
};

type Props = {
  art: ArtRecipe;
  size: number;
  /** corner radius as a fraction of the edge, like a printed card */
  radius?: number;
  disc?: Disc;
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  /** draw a soft drop shadow under the sleeve */
  lifted?: boolean;
};

export function Sleeve({
  art,
  size,
  radius = 0.12,
  disc,
  tilt = 0,
  className = '',
  style,
  lifted = true,
}: Props) {
  return (
    <div
      className={`sleeve ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * radius,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        boxShadow: lifted
          ? `0 ${size * 0.06}px ${size * 0.16}px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,.08)`
          : undefined,
        ...style,
      }}
    >
      {disc ? (
        <div
          className="sleeve__disc"
          style={{ width: disc.size, height: disc.size, left: disc.x, top: disc.y }}
        >
          <Vinyl
            size={disc.size}
            a={art.a}
            b={art.b}
            spinning={disc.spinning}
            degPerSec={disc.degPerSec}
          />
        </div>
      ) : null}
      <img
        className="sleeve__art"
        src={coverUrl(art, 512)}
        alt=""
        draggable={false}
        style={{ borderRadius: size * radius }}
      />
      <div className="sleeve__sheen" style={{ borderRadius: size * radius }} />
    </div>
  );
}
