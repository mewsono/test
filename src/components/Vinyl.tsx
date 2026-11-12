import { useSpin } from '../lib/useSpin';

type Props = {
  size: number;
  /** the label picks up the colours of its sleeve */
  a: string;
  b: string;
  spinning?: boolean;
  degPerSec?: number;
  className?: string;
  /** the lit edge catches the room */
  glow?: string;
};

export function Vinyl({ size, a, b, spinning = false, degPerSec = 20, className = '', glow }: Props) {
  const ref = useSpin(spinning, degPerSec);
  return (
    <div
      className={`vinyl ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: glow
          ? `0 ${size * 0.06}px ${size * 0.12}px rgba(0,0,0,.55), 0 0 ${size * 0.16}px ${glow}`
          : undefined,
      }}
      aria-hidden="true"
    >
      <div className="vinyl__spin" ref={ref}>
        <div className="vinyl__grooves" />
        <div className="vinyl__sheen" />
        <div
          className="vinyl__label"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        >
          <span className="vinyl__hole" />
        </div>
      </div>
      <div className="vinyl__light" />
    </div>
  );
}
