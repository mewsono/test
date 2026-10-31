# Pixiv Gallery

A quiet little art gallery: a mobile-first feed of night scenes — torii gates,
koi ponds, snow shrines — with likes, saves-by-mood, follows, search, posting and
a few appearance settings. Built from the single-file `Pixiv Gallery.html` mock as
a real Vite + TypeScript project.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run smoke      # build, then walk the main flows in a headless DOM
```

## Mobile

The app is built as a phone app first:

- **Full-height app frame.** `body` is locked and `.app` fills `100dvh`; the only
  scrolling box is `.scroll`, so the bottom nav, sheets and toast stay anchored
  while content scrolls underneath.
- **Safe areas.** `env(safe-area-inset-*)` padding on the scroller and nav keeps
  content clear of the notch and the home indicator (also in standalone mode via
  the `apple-mobile-web-app-*` meta tags).
- **On a wide screen** (`min-width: 600px`) the same markup is presented inside a
  390 x 844 handset frame with a notch, a status bar with a live clock and a home
  indicator — so the desktop preview looks like the phone build rather than a
  stretched column.
- **Small phones** (`max-width: 360px`), **landscape** and
  **`prefers-reduced-motion`** each get their own adjustments.
- **Touch polish.** `touch-action: manipulation`, no tap highlight, press-scale
  feedback, `overscroll-behavior: contain`; hover styles only apply on
  `(hover: hover)` devices.

## How it is put together

```
index.html          app shell (status bar, scroller, nav, detail sheet, post sheet, toast)
src/main.ts         event delegation, routing, render loop
src/styles.css      the whole visual system (tokens, layout, components)
src/lib/types.ts    domain types
src/lib/data.ts     artists, seed artworks, moods, challenge
src/lib/store.ts    localStorage-backed prefs + derived queries
src/lib/scenes.ts   procedural SVG cover art (six scenes)
src/lib/palettes.ts colour palettes for those scenes
src/lib/util.ts     esc/fmt/toggle helpers
src/lib/icons.ts    inline icon set
src/views/*.ts      one function per screen, returning an HTML string
tools/smoke.js      jsdom smoke test used by `npm run smoke`
```

### Notes

- **Covers are generated, not downloaded.** `src/lib/scenes.ts` draws each scene
  as inline SVG from a palette, so the app has zero image payloads and looks
  sharp at any size. Uploaded posts keep their own image (stored as a data URL,
  with the state falling back gracefully if `localStorage` is full).
- **State** is a tiny `prefs` object persisted under `pixiv-gallery-v2`: saved
  ids, liked ids, follows, accent colour, card titles, film grain, bio and any
  works posted from this device.
- **Routing** is hash based: `#home`, `#explore`, `#saved`, `#profile`, and
  `#art-<id>` opens the artwork sheet. Escape or the back button closes it.
- Rendering is a plain string per screen, delegated clicks via `data-act`, and
  `syncStates()` for cheap in-place updates of like/save/follow controls.

## Not done yet

There is no server: likes, follows and posts are local to the browser. A real
backend (auth, feed pagination, image upload/storage) is the obvious next step.
