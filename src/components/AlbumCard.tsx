import type { Album } from '../data/library';
import { Sleeve } from './Sleeve';

export function AlbumCard({
  album,
  size,
  variant = 'grid',
  onClick,
}: {
  album: Album;
  size: number;
  variant?: 'grid' | 'rail';
  onClick: () => void;
}) {
  const discSize = Math.round(size * (variant === 'grid' ? 0.81 : 0.86));
  return (
    <button
      type="button"
      className={`album-card album-card--${variant}`}
      onClick={onClick}
      aria-label={`Open ${album.title} by ${album.artist}`}
      style={{ width: size }}
    >
      <div className="album-card__stage" style={{ paddingTop: Math.round(size * 0.22) }}>
        <Sleeve
          art={album.art}
          size={size}
          radius={0.12}
          disc={{
            size: discSize,
            x: Math.round(size * (variant === 'grid' ? 0.11 : 0.07)),
            y: -Math.round(size * 0.21),
          }}
        />
      </div>
      <span className="album-card__title">{album.title}</span>
      <span className="album-card__meta">
        {album.artist} · {album.tracks.length} tracks
      </span>
    </button>
  );
}
