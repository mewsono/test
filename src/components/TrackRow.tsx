import { albumOf, type Track } from '../data/library';
import { formatTime } from '../lib/format';
import { Vinyl } from './Vinyl';

export function Equalizer() {
  return (
    <span className="eq" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function TrackRow({
  track,
  onPlay,
  showAlbum = false,
  active = false,
  playing = false,
}: {
  track: Track;
  onPlay: () => void;
  showAlbum?: boolean;
  active?: boolean;
  playing?: boolean;
}) {
  const album = albumOf(track);
  return (
    <button
      type="button"
      className={`row ${active ? 'is-active' : ''}`}
      onClick={onPlay}
      aria-label={`Play ${track.title} by ${track.artist}`}
    >
      <span className="row__disc">
        <Vinyl size={42} a={album.art.a} b={album.art.b} spinning={active && playing} degPerSec={42} />
      </span>
      <span className="row__meta">
        <span className="row__title">{track.title}</span>
        <span className="row__sub">
          {showAlbum ? `${album.title} · ${track.artist}` : track.artist}
        </span>
      </span>
      <span className="row__end">
        {active && playing ? <Equalizer /> : <span className="row__time tabular">{formatTime(track.duration)}</span>}
      </span>
    </button>
  );
}
