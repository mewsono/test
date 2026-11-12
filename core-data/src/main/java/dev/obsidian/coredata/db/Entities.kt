package dev.obsidian.coredata.db

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/** A file found by the scanner. Mirrors MediaStore so the UI never touches it directly. */
@Entity(
    tableName = "tracks",
    indices = [Index("albumId"), Index("artistId"), Index("folder"), Index("title")],
)
data class TrackEntity(
    @PrimaryKey val id: Long,
    val uri: String,
    val title: String,
    val artist: String,
    val artistId: Long,
    val album: String,
    val albumId: Long,
    val durationMs: Long,
    val trackNumber: Int,
    val year: Int,
    val genre: String?,
    val folder: String,
    val mimeType: String,
    val sampleRateHz: Int,
    val bitsPerSample: Int,
    val addedAtSec: Long,
    val artUri: String?,
    val hasEmbeddedArt: Boolean,
)

/** Kept apart from `tracks` so a rescan never wipes favourites or play counts. */
@Entity(tableName = "stats")
data class TrackStatsEntity(
    @PrimaryKey val trackId: Long,
    val favorite: Boolean = false,
    val playCount: Int = 0,
    val lastPlayedAt: Long = 0L,
)

data class TrackWithStats(
    @Embedded val track: TrackEntity,
    @Embedded(prefix = "s_") val stats: TrackStatsEntity?,
)

@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "playlist_tracks", primaryKeys = ["playlistId", "trackId"])
data class PlaylistTrackEntity(
    val playlistId: Long,
    val trackId: Long,
    val position: Int,
)

@Entity(tableName = "history", indices = [Index("playedAt")])
data class PlayEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val trackId: Long,
    val playedAt: Long = System.currentTimeMillis(),
)

/** Projections for the aggregate screens. */
data class AlbumRow(
    val id: Long,
    val title: String,
    val artist: String,
    val year: Int,
    val artUri: String?,
    val trackCount: Int,
    val durationMs: Long,
)

data class ArtistRow(
    val id: Long,
    val name: String,
    val albumCount: Int,
    val trackCount: Int,
    val artUri: String?,
)

data class PlaylistRow(
    val id: Long,
    val name: String,
    val trackCount: Int,
    val artUri: String?,
    val createdAt: Long,
)
