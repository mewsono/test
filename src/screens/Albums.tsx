import { ALBUMS, type Album } from '../data/library';
import { useMeasure } from '../lib/useMeasure';
import { AlbumCard } from '../components/AlbumCard';

const PAD = 24;
const GAP = 20;

export function Albums({ onOpenAlbum }: { onOpenAlbum: (album: Album) => void }) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const size = width > 0 ? Math.floor((width - PAD * 2 - GAP) / 2) : 150;

  const columns = [ALBUMS.filter((_, i) => i % 2 === 0), ALBUMS.filter((_, i) => i % 2 === 1)];

  return (
    <div className="screen albums">
      <header className="screen__head">
        <div>
          <div className="eyebrow">The wall</div>
          <h1 className="screen__title serif">Albums</h1>
        </div>
        <span className="screen__count">{ALBUMS.length}</span>
      </header>

      <div className="scroll albums__scroll" ref={ref}>
        <div className="stagger">
          <div className="stagger__col">
            {columns[0].map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                size={size}
                onClick={() => onOpenAlbum(album)}
              />
            ))}
          </div>
          <div className="stagger__col stagger__col--low">
            {columns[1].map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                size={size}
                onClick={() => onOpenAlbum(album)}
              />
            ))}
          </div>
        </div>
        <p className="albums__foot">Every cover cut by hand, no photography involved.</p>
      </div>
    </div>
  );
}
