# Porting yuri to Kotlin

Notes for the Android port, especially around audio effects and the
"open my phone's EQ" question.

## Short version

A web page cannot open Android Settings, switch on Dolby Atmos, or hand its audio
to the system EQ — the browser sandbox has no intent bridge. An Android app can
do all three. So that capability belongs to the port, not to this build.

In this app the system effect still applies anyway: Chrome's audio leaves through
the phone's normal media path, so if Dolby Atmos is already on system-wide, it
processes yuri's output today. The app just cannot turn it on or take you there.

## Opening the sound panel

```kotlin
startActivity(Intent(Settings.ACTION_SOUND_SETTINGS))
```

On OnePlus that lands on **Sound & vibration**, which is where Dolby Atmos lives
on OxygenOS. There is no public, documented activity for the Dolby panel itself;
the vendor ones (`com.oneplus.*`, `com.dolby.dax*`) differ per ROM and model, so
if you try them, wrap the call in a try/catch and fall back to the settings
screen.

## Let the system process your audio

Announce the audio session so system effects — including vendor ones — can attach
to it:

```kotlin
fun openEffectSession(player: ExoPlayer, context: Context) {
    val intent = Intent(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION).apply {
        putExtra(AudioEffect.EXTRA_AUDIO_SESSION, sessionId)
        putExtra(AudioEffect.EXTRA_PACKAGE_NAME, context.packageName)
        putExtra(AudioEffect.EXTRA_CONTENT_TYPE, AudioEffect.CONTENT_TYPE_MUSIC)
    }
    context.sendBroadcast(intent)
}
```

and send `ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION` when playback stops. Media3
hands you the id through `AudioListener.onAudioSessionIdChanged` (or set one with
`ExoPlayer.setAudioSessionId`).

If you build your own tone controls on that session — `Equalizer(0, sessionId)`,
`DynamicsProcessing(0, sessionId, …)` — check first whether Dolby has taken the
session over. On OnePlus it often does, and then a custom `Equalizer` is either
ignored or fights it. Decide which layer owns tone and say so in the UI; that is
the same trap the web build warns about with its own EQ.

## What maps to what

| here | there |
| --- | --- |
| `src/lib/engine.ts` | `ExoPlayer` + `MediaSession` + `AudioEffect` |
| 5-band peaking EQ (Web Audio) | `Equalizer` (5 bands) or `DynamicsProcessing.Eq` (API 28+) |
| **Spacious** (mid/side + room) | don't port it — use the system's Dolby Atmos / `Virtualizer`, or `DynamicsProcessing` |
| `<audio>` + Media Session API | `MediaSessionService` |
| `src/state/player.tsx` | `ViewModel` (the state is already plain data) |
| `src/lib/palette.ts` (k-means) | `androidx.palette` |
| `src/lib/cover.ts` | Compose `Canvas` / `drawWithCache` |
| `src/lib/useSpin.ts` | `Animatable` with exponential decay on pause |
| mesh blobs | radial-gradient brushes — drop the blur, the gradients are already soft (real blur needs API 31+) |
| film grain | noise `ImageBitmap` drawn with `BlendMode.SoftLight`, or an AGSL shader |
| CSS tokens in `src/styles/base.css` | one Compose theme: colours, type scale, glass alphas |
| Fraunces / Manrope variable fonts | `FontVariation.Settings` on `Font(R.font.…)` |

## Worth keeping identical

The transport state is deliberately plain: queue of track ids, index, repeat,
shuffle, liked ids, five EQ gains, one spatial flag. No Web Audio types leak into
it, so it lifts into a `ViewModel` and `SavedStateHandle` without redesign. Same
for the track metadata in `src/data/library.ts` and the generated
`src/data/audio-meta.json` (durations and peak envelopes) — both are plain JSON.
