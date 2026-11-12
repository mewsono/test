package dev.obsidian.coredata.scanner

import android.content.ContentUris
import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import dev.obsidian.coredata.db.TrackEntity
import dev.obsidian.coredata.settings.SettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext

data class ScanResult(val tracks: List<TrackEntity>, val skippedTooShort: Int)

/**
 * Reads the device's audio index and turns it into rows for Room.
 * MediaStore only — no filesystem walking, so scoped storage is respected.
 */
class MediaScanner(
    private val context: Context,
    private val settings: SettingsRepository,
) {

    suspend fun scan(): ScanResult = withContext(Dispatchers.IO) {
        val config = settings.settings.first()
        val minMs = config.minTrackLengthSec * 1000L

        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
        } else {
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        }

        val pathColumn = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Audio.Media.RELATIVE_PATH
        } else {
            @Suppress("DEPRECATION") MediaStore.Audio.Media.DATA
        }

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ARTIST_ID,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.TRACK,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.DATE_ADDED,
            pathColumn,
        )

        val tracks = mutableListOf<TrackEntity>()
        var tooShort = 0

        context.contentResolver.query(
            collection,
            projection,
            "${MediaStore.Audio.Media.IS_MUSIC} != 0",
            null,
            "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC",
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
            val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
            val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
            val artistIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST_ID)
            val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
            val albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
            val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
            val trackCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)
            val yearCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
            val mimeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
            val addedCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
            val folderCol = cursor.getColumnIndexOrThrow(pathColumn)

            while (cursor.moveToNext()) {
                val duration = cursor.getLong(durationCol)
                if (duration > 0 && duration < minMs) {
                    tooShort++
                    continue
                }

                val id = cursor.getLong(idCol)
                val albumId = cursor.getLong(albumIdCol)
                val folder = normalizeFolder(cursor.getString(folderCol) ?: "")

                if (!folderAllowed(folder, config.includedFolders, config.excludedFolders)) continue

                val artist = cursor.getString(artistCol)?.takeIf { it.isNotBlank() && it != "<unknown>" }
                    ?: "Unknown artist"

                val uri = ContentUris.withAppendedId(collection, id).toString()
                val tech = readTech(uri)

                tracks += TrackEntity(
                    id = id,
                    uri = uri,
                    title = cursor.getString(titleCol)?.takeIf { it.isNotBlank() } ?: "Untitled",
                    artist = artist,
                    artistId = cursor.getLong(artistIdCol),
                    album = cursor.getString(albumCol)?.takeIf { it.isNotBlank() } ?: "Unknown album",
                    albumId = albumId,
                    durationMs = duration,
                    trackNumber = cursor.getInt(trackCol) % 1000,
                    year = cursor.getInt(yearCol),
                    genre = null,
                    folder = folder,
                    mimeType = cursor.getString(mimeCol) ?: tech.mime,
                    sampleRateHz = tech.sampleRate,
                    bitsPerSample = tech.bitsPerSample,
                    addedAtSec = cursor.getLong(addedCol),
                    artUri = albumArtUri(albumId),
                    hasEmbeddedArt = tech.hasEmbeddedArt,
                )
            }
        }

        ScanResult(tracks = tracks, skippedTooShort = tooShort)
    }

    private fun albumArtUri(albumId: Long): String? =
        if (albumId <= 0) null else {
            ContentUris.withAppendedId(
                Uri.parse("content://media/external/audio/albumart"),
                albumId,
            ).toString()
        }

    private fun normalizeFolder(raw: String): String =
        raw.trim().trimEnd('/').removePrefix("/storage/emulated/0").ifBlank { "/" }

    private fun folderAllowed(folder: String, include: Set<String>, exclude: Set<String>): Boolean {
        if (include.isNotEmpty() && include.none { folder.contains(it, ignoreCase = true) }) return false
        if (exclude.any { folder.contains(it, ignoreCase = true) }) return false
        return true
    }

    private data class Tech(
        val sampleRate: Int = 0,
        val bitsPerSample: Int = 0,
        val mime: String = "",
        val hasEmbeddedArt: Boolean = false,
    )

    /**
     * Sample rate and bit depth for the quality chip. Best effort: a container that
     * won't open simply reports zeros and the chip falls back to the codec name.
     */
    private fun readTech(uri: String): Tech = runCatching {
        val extractor = MediaExtractor()
        try {
            extractor.setDataSource(context, Uri.parse(uri), null)
            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
                if (!mime.startsWith("audio/")) continue
                val sampleRate = if (format.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
                    format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                } else 0
                val bits = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                    format.containsKey(MediaFormat.KEY_BITS_PER_SAMPLE)
                ) format.getInteger(MediaFormat.KEY_BITS_PER_SAMPLE) else 0
                return Tech(sampleRate, bits, mime, hasEmbeddedArt = false)
            }
            Tech()
        } finally {
            extractor.release()
        }
    }.getOrDefault(Tech())
}
