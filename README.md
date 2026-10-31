# pixiv. — Kotlin / Compose Android app

A dark, editorial Pixiv-style browsing app built from the supplied design:
**Home** gallery feed → **Artwork** detail → **Discover**.

| Path | What it is |
| --- | --- |
| `preview/` | Live design preview — zero-dependency static server, interactive UI |
| `app/` | Android app module — Kotlin + Jetpack Compose (Material 3) |
| `.github/workflows/build-apk.yml` | CI: builds `debug` APK, uploads it as an artifact |

## 1. Live design preview

```bash
node preview/server.mjs     # → http://localhost:5173
```

Recreates all three screens at 390 × 844 dp with the real typefaces
(**Bricolage Grotesque** + **DM Sans**, both OFL and bundled in `app/.../res/font`),
the real vector artwork, and working chips, likes, follows, search and tab jumps.
The left rail has a phone-frame / full-screen toggle and a colour palette reference.

## 2. Build the APK

**On GitHub (no local SDK needed):** every push runs
`:mobile:assembleDebug` and publishes **`pixiv-debug-apk`** under the run's
*Artifacts* section — currently building green (~9.4 MB).
Download it and sideload on an Android device (minSdk 26 / Android 8+).

**Locally:**
```bash
cd app && ./gradlew assembleDebug
# → app/mobile/build/outputs/apk/debug/app-debug.apk
```
Requires JDK 17 + Android SDK (platform 35, build-tools 35.0.0).

## 3. How the design maps to code

| Design element | Compose implementation |
| --- | --- |
| Colour / type / spacing tokens | `ui/theme/Tokens.kt` (`PixivColors`, `PixivDimens`, `PixivType`) |
| Wordmark, buttons, chips, nav pill, avatars | `ui/components/Common.kt` |
| Hero + thumbnail artwork | `ui/components/ArtworkCanvas.kt` — drawn with Compose `Canvas`, no bitmaps |
| Home / Artwork / Discover | `ui/screens/*.kt` |
| Shell, tab state, detail push | `MainActivity.kt` (`PixivApp`) |
| Demo content | `data/DemoData.kt` |

Everything is state-driven (`remember` / `mutableStateOf`), so wiring a real
repository later means replacing `DemoData` calls, not rewriting the UI.

## Notes

- `Saved` and `Profile` tabs are not designed yet; they fall back to Home.
- Artwork is illustrative vector art (torii gate, pagoda, koi, shrine) rather than
  photography, so there are no image licensing questions and no drawable assets
  to maintain.
