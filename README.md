# yuri

A record shop at night, in the browser.

yuri is a small music player: six albums, twenty-four tracks, every sleeve cut by
hand, every note generated from scratch. No stock audio, no stock artwork, no
runtime requests to anyone's server.

```bash
npm install
npm run dev      # http://localhost:5173
```

## The idea

The room is near-black. The only light comes from whatever is on the turntable:
three blurred blobs sampled from the sleeve's own pixels, cross-fading as the
record changes, film grain over the top. Everything else is glass, cream and one
warm accent.

- **Sleeves** are drawn on a `<canvas>` at load time — gradient, motif, ring,
  grain — then encoded once and reused.
- **The room's palette** is extracted from those pixels with k-means
  (`src/lib/palette.ts`), the way Android's `palette_generator` would read a
  bitmap: quantise, keep what is plentiful and vivid, lift it until it glows.
- **The vinyl** turns while the music does, and does not stop dead — speed bleeds
  off exponentially on pause (`src/lib/useSpin.ts`).
- **The seek bar** is a travelling sine for the played part, a flat line for the
  rest, and its amplitude follows the actual programme material.
- **The window** is a mesh of three drifting blobs; the player rises over it and
  the shop dims behind.

## What actually works

- Playback through a real `<audio>` element, routed into a Web Audio graph.
- Seek by dragging the wave, shuffle, repeat one/all, next/previous, a sleep
  timer, and a five-band EQ that shapes the live signal.
- Library, staggered album wall, album sleeves with track notes, search across
  titles/artists/genres, liked songs and counter mixes.
- State persists: queue, position, volume, tone, likes.
- Keyboard: space to play/pause, ←/→ to scrub, shift + ←/→ to skip, escape to
  close.
- Lock-screen metadata through the Media Session API.

## Sound

`scripts/make-audio.mjs` is a small synthesiser: Karplus–Strong plucks, two-op FM
electric piano, detuned saw pads, a noise-and-tone drum kit, a Schroeder reverb,
ping-pong delay, tape wow, vinyl crackle and a soft limiter. Each track is an
arrangement over a chord progression rendered to PCM and encoded to MP3 with
`lamejs`.

```bash
npm run audio                 # render all 24 tracks (~3 min)
node scripts/make-audio.mjs --only=m1a --wav   # one track, plus a debug wav
```

Output lands in `public/audio/` with lengths and peak envelopes written to
`src/data/audio-meta.json`.

## Checks

```bash
npm run build     # typecheck + production build
npm run smoke     # render the whole app in jsdom and click through it
```

## Layout of the code

```
src/
  lib/        engine (audio graph), cover art, palette, colour, spin, format
  state/      player context: queue, transport, likes, persistence
  components/ vinyl, sleeve, seek bar, mesh, nav, mini player, sheets
  screens/    home, albums, album detail, search, lists, now playing, EQ
  styles/     fonts, base (room), ui (parts), screens (rooms)
scripts/      audio forge + smoke test
public/       audio, fonts (Fraunces + Manrope, SIL OFL — see fonts/OFL.txt)
```

Fonts are the Google Fonts variable subsets of Fraunces Italic and Manrope,
served locally under the SIL Open Font License; the licence travels with them in
`public/fonts/OFL.txt`.
