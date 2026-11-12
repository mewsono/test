package dev.obsidian.coredata.model

/** A playable file on the device. Everything here is local; nothing is networked. */
data class Track(
    val id: Long,
    val uri: String,
    val title: String,
    val artist: String,
    val artistId: Long,
    val album: String,
    val albumId: Long,
    val durationMs: Long,
    val trackNumber: Int = 0,
    val year: Int = 0,
    val genre: String? = null,
    val folder: String = "",
    val mimeType: String = "",
    val sampleRateHz: Int = 0,
    val bitsPerSample: Int = 0,
    val addedAtSec: Long = 0L,
    val artUri: String? = null,
    val hasEmbeddedArt: Boolean = false,
    val isFavorite: Boolean = false,
    val playCount: Int = 0,
    val lastPlayedAt: Long = 0L,
) {
    /** e.g. "FLAC · 24/96" for the quality chip on Now Playing. */
    val qualityLabel: String
        get() {
            val codec = when {
                mimeType.contains("flac", true) -> "FLAC"
                mimeType.contains("mpeg", true) || mimeType.contains("mp3", true) -> "MP3"
                mimeType.contains("mp4", true) || mimeType.contains("m4a", true) -> "AAC"
                mimeType.contains("ogg", true) -> "OGG"
                mimeType.contains("opus", true) -> "OPUS"
                mimeType.contains("wav", true) || mimeType.contains("x-wav", true) -> "WAV"
                else -> "AUDIO"
            }
            if (bitsPerSample > 0 && sampleRateHz > 0) {
                val khz = sampleRateHz / 1000.0
                val rate = if (khz % 1.0 == 0.0) khz.toInt().toString() else khz.toString()
                return "$codec · $bitsPerSample/$rate"
            }
            if (sampleRateHz > 0) return "$codec · ${sampleRateHz / 1000} kHz"
            return codec
        }
}

data class Album(
    val id: Long,
    val title: String,
    val artist: String,
    val year: Int,
    val artUri: String?,
    val trackCount: Int,
    val durationMs: Long,
)

data class Artist(
    val id: Long,
    val name: String,
    val albumCount: Int,
    val trackCount: Int,
    val artUri: String?,
)

data class Playlist(
    val id: Long,
    val name: String,
    val trackCount: Int,
    val artUri: String?,
    val createdAt: Long,
)

enum class RepeatMode { Off, All, One }

/** How playback reacts to another app taking audio focus. */
enum class FocusBehavior { Pause, Duck, KeepPlaying }

enum class LibraryTab { Songs, Albums, Artists, Playlists, Folders }

enum class TrackSort(val label: String) {
    TitleAsc("Title A–Z"),
    TitleDesc("Title Z–A"),
    ArtistAsc("Artist A–Z"),
    AlbumAsc("Album A–Z"),
    RecentlyAdded("Recently added"),
    DurationDesc("Longest first"),
    MostPlayed("Most played"),
}

/** A lyric line; `timeMs` is 0 for unsynced files. */
data class LyricLine(val timeMs: Long, val text: String)

data class Lyrics(
    val lines: List<LyricLine>,
    val synced: Boolean,
)

data class PlaybackSnapshot(
    val trackId: Long?,
    val isPlaying: Boolean,
    val positionMs: Long,
    val durationMs: Long,
    val repeatMode: RepeatMode,
    val shuffle: Boolean,
    val queue: List<Long>,
)
