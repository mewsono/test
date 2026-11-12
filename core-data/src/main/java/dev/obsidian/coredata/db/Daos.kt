package dev.obsidian.coredata.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

private const val TRACK_WITH_STATS = """
    SELECT t.*, s.trackId AS s_trackId, s.favorite AS s_favorite,
           s.playCount AS s_playCount, s.lastPlayedAt AS s_lastPlayedAt
    FROM tracks t LEFT JOIN stats s ON s.trackId = t.id
"""

@Dao
interface TrackDao {

    @Query("$TRACK_WITH_STATS ORDER BY t.title COLLATE NOCASE ASC")
    fun observeAll(): Flow<List<TrackWithStats>>

    @Query("$TRACK_WITH_STATS WHERE t.id = :id LIMIT 1")
    fun observeTrack(id: Long): Flow<List<TrackWithStats>>

    @Query("$TRACK_WITH_STATS WHERE t.id = :id")
    suspend fun getTrack(id: Long): TrackWithStats?

    @Query(
        """
        $TRACK_WITH_STATS
        WHERE t.title LIKE '%' || :query || '%'
           OR t.artist LIKE '%' || :query || '%'
           OR t.album LIKE '%' || :query || '%'
        ORDER BY t.title COLLATE NOCASE ASC
        """,
    )
    fun search(query: String): Flow<List<TrackWithStats>>

    @Query("$TRACK_WITH_STATS WHERE t.albumId = :albumId ORDER BY t.trackNumber, t.title")
    fun observeAlbumTracks(albumId: Long): Flow<List<TrackWithStats>>

    @Query("$TRACK_WITH_STATS WHERE t.artistId = :artistId ORDER BY t.album, t.trackNumber")
    fun observeArtistTracks(artistId: Long): Flow<List<TrackWithStats>>

    @Query("SELECT * FROM tracks WHERE folder = :folder ORDER BY title")
    fun observeFolder(folder: String): Flow<List<TrackEntity>>

    @Query("SELECT * FROM tracks")
    suspend fun all(): List<TrackEntity>

    @Query("SELECT * FROM tracks WHERE id IN (:ids)")
    suspend fun byIds(ids: List<Long>): List<TrackEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(tracks: List<TrackEntity>)

    @Query("DELETE FROM tracks WHERE id NOT IN (:keep)")
    suspend fun deleteExcept(keep: List<Long>)

    @Query("DELETE FROM tracks")
    suspend fun clear()

    /* aggregates */

    @Query(
        """
        SELECT albumId AS id, album AS title, MIN(artist) AS artist, MAX(year) AS year,
               MIN(artUri) AS artUri, COUNT(*) AS trackCount, SUM(durationMs) AS durationMs
        FROM tracks GROUP BY albumId ORDER BY title COLLATE NOCASE ASC
        """,
    )
    fun observeAlbums(): Flow<List<AlbumRow>>

    @Query(
        """
        SELECT artistId AS id, MIN(artist) AS name, COUNT(DISTINCT albumId) AS albumCount,
               COUNT(*) AS trackCount, MIN(artUri) AS artUri
        FROM tracks GROUP BY artistId ORDER BY name COLLATE NOCASE ASC
        """,
    )
    fun observeArtists(): Flow<List<ArtistRow>>

    @Query("SELECT DISTINCT folder FROM tracks ORDER BY folder COLLATE NOCASE ASC")
    fun observeFolders(): Flow<List<String>>

    @Query("SELECT COUNT(*) FROM tracks")
    fun observeCount(): Flow<Int>

    @Query(
        """
        $TRACK_WITH_STATS
        ORDER BY t.addedAtSec DESC LIMIT :limit
        """,
    )
    fun recentlyAdded(limit: Int = 50): Flow<List<TrackWithStats>>

    @Query(
        """
        $TRACK_WITH_STATS
        WHERE s_playCount > 0 ORDER BY s_playCount DESC LIMIT :limit
        """,
    )
    fun mostPlayed(limit: Int = 50): Flow<List<TrackWithStats>>

    @Query(
        """
        $TRACK_WITH_STATS
        WHERE COALESCE(s_playCount, 0) = 0 ORDER BY t.addedAtSec DESC LIMIT :limit
        """,
    )
    fun neverPlayed(limit: Int = 50): Flow<List<TrackWithStats>>
}

@Dao
interface StatsDao {

    @Query("SELECT favorite FROM stats WHERE trackId = :trackId")
    suspend fun favorite(trackId: Long): Boolean?

    @Query("INSERT INTO stats (trackId, favorite, playCount, lastPlayedAt) VALUES (:trackId, :favorite, 0, 0)")
    suspend fun seed(trackId: Long, favorite: Boolean)

    @Query("UPDATE stats SET favorite = :favorite WHERE trackId = :trackId")
    suspend fun setFavorite(trackId: Long, favorite: Boolean)

    @Query("SELECT trackId FROM stats WHERE favorite = 1")
    fun observeFavorites(): Flow<List<Long>>

    @Transaction
    suspend fun toggleFavorite(trackId: Long): Boolean {
        val current = favorite(trackId)
        val next = !(current ?: false)
        if (current == null) seed(trackId, next) else setFavorite(trackId, next)
        return next
    }

    @Query("INSERT INTO stats (trackId, favorite, playCount, lastPlayedAt) VALUES (:trackId, 0, 1, :at)")
    suspend fun seedPlay(trackId: Long, at: Long)

    @Query("UPDATE stats SET playCount = playCount + 1, lastPlayedAt = :at WHERE trackId = :trackId")
    suspend fun bumpPlay(trackId: Long, at: Long)

    /** Seeds the row on first play, then increments. */
    @Transaction
    suspend fun recordPlay(trackId: Long, at: Long) {
        if (favorite(trackId) == null) seedPlay(trackId, at) else bumpPlay(trackId, at)
    }

    @Query(
        """
        SELECT t.* FROM tracks t
        INNER JOIN stats s ON s.trackId = t.id
        WHERE s.lastPlayedAt > 0
        ORDER BY s.lastPlayedAt DESC LIMIT :limit
        """,
    )
    fun recentlyPlayed(limit: Int = 20): Flow<List<TrackEntity>>
}

@Dao
interface PlaylistDao {

    @Query(
        """
        SELECT p.id, p.name, p.createdAt,
               (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlistId = p.id) AS trackCount,
               (SELECT t.artUri FROM playlist_tracks pt2
                  INNER JOIN tracks t ON t.id = pt2.trackId
                  WHERE pt2.playlistId = p.id ORDER BY pt2.position LIMIT 1) AS artUri
        FROM playlists p ORDER BY p.createdAt ASC
        """,
    )
    fun observeAll(): Flow<List<PlaylistRow>>

    @Query("SELECT * FROM playlist_tracks WHERE playlistId = :id ORDER BY position")
    fun observeEntries(id: Long): Flow<List<PlaylistTrackEntity>>

    @Query(
        """
        SELECT t.* FROM tracks t
        INNER JOIN playlist_tracks p ON p.trackId = t.id
        WHERE p.playlistId = :playlistId ORDER BY p.position
        """,
    )
    fun observeTracks(playlistId: Long): Flow<List<TrackEntity>>

    @Insert
    suspend fun insert(playlist: PlaylistEntity): Long

    @Query("UPDATE playlists SET name = :name WHERE id = :id")
    suspend fun rename(id: Long, name: String)

    @Query("DELETE FROM playlists WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("DELETE FROM playlist_tracks WHERE playlistId = :id")
    suspend fun clearEntries(id: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntries(entries: List<PlaylistTrackEntity>)

    @Query("SELECT COALESCE(MAX(position), -1) FROM playlist_tracks WHERE playlistId = :id")
    suspend fun maxPosition(id: Long): Int

    @Transaction
    suspend fun setTracks(playlistId: Long, trackIds: List<Long>) {
        clearEntries(playlistId)
        insertEntries(trackIds.mapIndexed { index, trackId ->
            PlaylistTrackEntity(playlistId = playlistId, trackId = trackId, position = index)
        })
    }
}

@Dao
interface HistoryDao {

    @Insert
    suspend fun insert(event: PlayEventEntity)

    @Query("SELECT * FROM history ORDER BY playedAt DESC LIMIT :limit")
    fun recent(limit: Int = 100): Flow<List<PlayEventEntity>>

    @Query("DELETE FROM history")
    suspend fun clear()
}
