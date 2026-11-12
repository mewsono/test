# Obsidian

A local-first music player for Android, built the way a dark OLED screen wants to be built:
true `#000000` everywhere, one accent colour, no noise.

Kotlin · Jetpack Compose (Material 3) · AndroidX Media3 (ExoPlayer + MediaSession) · Hilt · Room · DataStore · Coil

---

## What it is

Obsidian plays the audio files already on your phone. There is no account, no sync, no
telemetry, no ads — and the manifest has **no `INTERNET` permission at all**. If the app
ever needed the network, it could not connect.

| | |
|---|---|
| Min SDK | 26 (Android 8.0) |
| Target SDK | 35 |
| Languages | English |
| Modules | `app`, `core-ui`, `core-data`, `feature-player`, `feature-library`, `feature-settings` |

## Design rules (non-negotiable)

- **Background is `#000000`.** Never a dark grey page. Raised surfaces are `#0A0A0C`, `#101013`, `#121215` and stay small; hairlines are `#1C1C20`.
- **One accent.** Default lime `#C8F542`; aqua `#5EEAD4`, coral `#FF8A5B`, violet `#B69CFF` available, or adaptive from the album art. Accent appears on exactly six things: play button, seek fill, active chip, active nav item, favourite heart, now-playing indicator.
- **Two bundled typefaces.** Space Grotesk for titles and lyrics, Inter for body. Both ship inside the APK — nothing is downloaded.
- **Motion ≤ 300 ms.** Spring-dragged sheets, a shared-element mini player → Now Playing, and nothing that makes you wait.
- The only gradient in the app is the soft radial glow in the album's colour behind the artwork, fading to pure black.

## Features

- **Formats** — MP3, AAC/M4A, FLAC, OGG, OPUS, WAV. Tags and embedded artwork read from the file.
- **Library** — MediaStore scan (no filesystem walking), folder include/exclude rules, minimum track length, chips for Songs / Albums / Artists / Playlists / Folders, sorting, "Shuffle all".
- **Now Playing** — rounded art with the radial glow, quality chip (`FLAC · 24/96`), seek with a 14 dp thumb, shuffle, previous/next, 76 dp play button, repeat off/all/one, and Lyrics / EQ / Sleep / Cast utilities.
- **Queue** — drag to reorder, swipe to remove, clear, save as playlist.
- **Lyrics** — LRC sidecars and embedded lyrics, synced highlighting in accent, tap a line to seek, plain text when nothing is timed.
- **Equalizer** — 10 band ±12 dB vertical sliders, Flat / Bass Boost / Vocal / Custom, bass boost, loudness enhancer, gapless + crossfade, reset. Uses the platform `Equalizer`, `BassBoost`, `LoudnessEnhancer`.
- **Playback service** — foreground `MediaSessionService`: lock-screen and notification controls, Bluetooth/headset buttons, audio focus, becoming-noisy handling, Android Auto-ready, resume point remembered.
- **Library data** — favourites, playlists, play counts and history in Room; smart lists for recently added, most played and never played.
- **Accessibility** — every icon button has a TalkBack label, touch targets are ≥ 48 dp, layout survives 200% font scale, haptics on play/pause and seek commit.

## Build

```bash
./gradlew assembleDebug          # app/build/outputs/apk/debug/app-debug.apk
./gradlew installDebug           # to a connected device
```

Requires JDK 17 and the Android SDK with platform 35 + build-tools 35. Gradle 8.10.2 comes
with the wrapper. All dependency versions live in `gradle/libs.versions.toml`.

## Changing the accent colour

Accents are declared once, in `core-ui/.../theme/Accent.kt`:

```kotlin
enum class AccentChoice(val key: String, val label: String, val color: Color) {
    Lime("lime", "Lime", Color(0xFFC8F542)),
    Aqua("aqua", "Aqua", Color(0xFF5EEAD4)),
    Coral("coral", "Coral", Color(0xFFFF8A5B)),
    Violet("violet", "Violet", Color(0xFFB69CFF)),
}
```

1. Add an entry (or edit a colour) in that enum.
2. `AccentChoice.Default` picks the built-in default; the stored preference key survives
   because it is written to DataStore as a plain string.
3. Relaunch. Every use of the accent reads `LocalAccent` (`accentColor`), which
   `ObsidianTheme(accent = …)` provides, so nothing else needs touching.

To change the *default* for fresh installs, edit `AccentChoice.Default` and the `"lime"`
fallback in `core-data/.../settings/SettingsRepository.kt`.

Adaptive accent samples the album art with Palette and feeds the same
`ObsidianTheme(accent = …)` parameter, so a custom accent works with it unchanged.

## Architecture

```
app ────────────── MainActivity · navigation · widget
 ├── feature-player ── Now Playing · Queue · Lyrics · Equalizer · playback service
 ├── feature-library ─ Library · Home · Search · detail · playlists
 ├── feature-settings ─ Settings
 ├── core-data ────── Room, DataStore, MediaStore scanner, repositories
 └── core-ui ──────── theme tokens, typography, shapes, shared components
```

Single activity, Compose Navigation, MVVM with `StateFlow`, Hilt for wiring. The player is a
foreground `MediaSessionService`; the UI talks to it through `PlaybackConnection`, a small
facade over `MediaController`, so no screen touches ExoPlayer directly.

The seek bar takes its position as a **lambda** and reads it inside the draw phase, so the
4 Hz position tick invalidates drawing and never recomposes the subtree.

## Project status

Implemented in the tree right now:

- Gradle multi-module build, version catalogue, wrapper
- Design system: colour, type (both fonts instanced and bundled), shapes, theme, accent local
- Components: album art, seek bar, buttons/pills/chips, animated bars, hairlines
- Data layer: Room schema and DAOs, DataStore settings, MediaStore scanner, repository
- Playback: `ObsidianPlaybackService` (MediaSessionService + ExoPlayer), `PlaybackConnection`, audio effects engine
- App shell: single activity, permission flow, scan, library list, mini player

Next up, in order: the six screens (Now Playing first), the navigation graph and bottom bar,
the Glance widget, then the full settings surface.

## Licence

Personal project. Fonts: Space Grotesk (OFL), Inter (OFL).
