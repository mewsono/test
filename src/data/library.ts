import audioMeta from './audio-meta.json';

export type ArtMotif = 'disc' | 'arc' | 'bars' | 'sun' | 'grid' | 'wave' | 'orb';

export type ArtRecipe = {
  /** gradient ends */
  a: string;
  b: string;
  /** the motif colour */
  ink: string;
  motif: ArtMotif;
  /** gradient angle, degrees */
  angle: number;
};

export type Track = {
  id: string;
  title: string;
  albumId: string;
  artist: string;
  albumTitle: string;
  trackNo: number;
  duration: number;
  peaks: number[];
  src: string;
  /** a little monger's note, shown in the album sleeve notes */
  note?: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  art: ArtRecipe;
  note: string;
  tracks: Track[];
};

type Meta = Record<string, { duration: number; peaks: number[]; bytes: number }>;
const meta = audioMeta as Meta;

type Seed = {
  album: Omit<Album, 'tracks'>;
  tracks: { id: string; title: string; note?: string }[];
};

const SEEDS: Seed[] = [
  {
    album: {
      id: 'm1',
      title: 'Midnight Drive',
      artist: 'Sable Coast',
      year: 2024,
      genre: 'Neon soul',
      note: 'Recorded in a garage off the expressway, windows down, engine idling for the reverb.',
      art: { a: '#FF6A4D', b: '#7C6CFF', ink: '#FFC454', motif: 'disc', angle: 145 },
    },
    tracks: [
      { id: 'm1a', title: 'Chrome Rain', note: 'Rhodes, brushes, a wet street.' },
      { id: 'm1b', title: 'Neon Underglow' },
      { id: 'm1c', title: 'Tollbooth at 3AM' },
      { id: 'm1d', title: 'Rearview Halo' },
    ],
  },
  {
    album: {
      id: 'g2',
      title: 'Glass Horizons',
      artist: 'Nova Gray',
      year: 2023,
      genre: 'Ambient',
      note: 'Six mornings of field recordings, folded into pads. Best played loud enough to forget.',
      art: { a: '#5EE0C0', b: '#2A1F5C', ink: '#FF6A4D', motif: 'arc', angle: 160 },
    },
    tracks: [
      { id: 'g2a', title: 'Sea Glass', note: 'Bells tuned to a lydian fourth.' },
      { id: 'g2b', title: 'Vertical Light' },
      { id: 'g2c', title: 'Slow Meridian' },
      { id: 'g2d', title: 'Aperture' },
    ],
  },
  {
    album: {
      id: 'a3',
      title: 'Amber Static',
      artist: 'The Lantern Club',
      year: 2025,
      genre: 'Downtempo',
      note: 'A three-piece that only rehearses after the shops shut. Brass lamps, felt mutes.',
      art: { a: '#FFC454', b: '#FF6A4D', ink: '#2A1F5C', motif: 'bars', angle: 130 },
    },
    tracks: [
      { id: 'a3a', title: 'Lantern Oil', note: 'Shaker first, questions later.' },
      { id: 'a3b', title: 'Amber Static' },
      { id: 'a3c', title: 'Two-Step Lobby' },
      { id: 'a3d', title: 'Copper Hymn' },
    ],
  },
  {
    album: {
      id: 'p4',
      title: 'Paper Moons',
      artist: 'Iris Vale',
      year: 2022,
      genre: 'Piano',
      note: 'Written for a room with one lamp. Every take was cut after midnight.',
      art: { a: '#7C6CFF', b: '#0E7C86', ink: '#FFC454', motif: 'sun', angle: 150 },
    },
    tracks: [
      { id: 'p4a', title: 'Paper Moons', note: 'Held pedal, unhurried.' },
      { id: 'p4b', title: 'Folded Light' },
      { id: 'p4c', title: 'Quiet Hours' },
      { id: 'p4d', title: 'Lullaby for a Stranger' },
    ],
  },
  {
    album: {
      id: 'v5',
      title: 'Velvet District',
      artist: 'Ko',
      year: 2025,
      genre: 'Deep house',
      note: 'A basement, a borrowed 909, and a doorman who let the tape run all night.',
      art: { a: '#FF8FB1', b: '#7C6CFF', ink: '#F6EFE6', motif: 'grid', angle: 135 },
    },
    tracks: [
      { id: 'v5a', title: 'Velvet District', note: 'Kick on the floor, everything else late.' },
      { id: 'v5b', title: 'Basement Blue' },
      { id: 'v5c', title: 'Rope & Brass' },
      { id: 'v5d', title: 'After Hours Apartment' },
    ],
  },
  {
    album: {
      id: 'l6',
      title: 'Low Tide Radio',
      artist: 'Marlow',
      year: 2024,
      genre: 'Hazy pop',
      note: 'Pirate-radio sessions taped off a coastal transmitter. Some hiss left in on purpose.',
      art: { a: '#0E7C86', b: '#2A1F5C', ink: '#FFC454', motif: 'wave', angle: 155 },
    },
    tracks: [
      { id: 'l6a', title: 'Low Tide Radio', note: 'Tuned by hand.' },
      { id: 'l6b', title: 'Salt on the Dial' },
      { id: 'l6c', title: 'Fog Signal' },
      { id: 'l6d', title: 'Driftwood' },
    ],
  },
];

export const ALBUMS: Album[] = SEEDS.map(({ album, tracks }) => ({
  ...album,
  tracks: tracks.map((t, i) => {
    const m = meta[t.id];
    return {
      id: t.id,
      title: t.title,
      albumId: album.id,
      artist: album.artist,
      albumTitle: album.title,
      trackNo: i + 1,
      duration: m?.duration ?? 40,
      peaks: m?.peaks ?? [],
      src: `/audio/${t.id}.mp3`,
      note: t.note,
    };
  }),
}));

export const ALL_TRACKS: Track[] = ALBUMS.flatMap((a) => a.tracks);
export const TRACK_BY_ID = new Map(ALL_TRACKS.map((t) => [t.id, t]));
export const ALBUM_BY_ID = new Map(ALBUMS.map((a) => [a.id, a]));

export const albumOf = (track: Track): Album => ALBUM_BY_ID.get(track.albumId)!;

export type Playlist = {
  id: string;
  title: string;
  blurb: string;
  trackIds: string[];
  art: ArtRecipe;
};

export const PLAYLISTS: Playlist[] = [
  {
    id: 'pl-open-till-2',
    title: 'Open Till 2',
    blurb: 'The shop after the shutters come down.',
    trackIds: ['a3a', 'm1b', 'v5a', 'l6a', 'm1d', 'v5c'],
    art: { a: '#FFC454', b: '#7C6CFF', ink: '#FF6A4D', motif: 'orb', angle: 120 },
  },
  {
    id: 'pl-rain-on-the-window',
    title: 'Rain on the Window',
    blurb: 'Soft edges, long fades, no destination.',
    trackIds: ['g2a', 'p4c', 'g2d', 'p4d', 'l6d', 'g2b'],
    art: { a: '#5EE0C0', b: '#0E7C86', ink: '#F6EFE6', motif: 'wave', angle: 165 },
  },
  {
    id: 'pl-last-train',
    title: 'Last Train Home',
    blurb: 'Sleeves under the arm, headphones in.',
    trackIds: ['m1a', 'a3c', 'v5b', 'l6b', 'p4b', 'a3b'],
    art: { a: '#FF8FB1', b: '#FF6A4D', ink: '#FFC454', motif: 'arc', angle: 100 },
  },
];

export const PLAYLIST_BY_ID = new Map(PLAYLISTS.map((p) => [p.id, p]));

/** the front-of-shop selection */
export const NEW_ARRIVALS = ['v5', 'a3', 'm1', 'g2', 'p4', 'l6'];

export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'albums', label: 'Albums' },
  { id: 'search', label: 'Search' },
  { id: 'lists', label: 'Lists' },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];
