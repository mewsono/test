package dev.obsidian.coredata.repository

import dev.obsidian.coredata.db.AlbumRow
import dev.obsidian.coredata.db.ArtistRow
import dev.obsidian.coredata.db.HistoryDao
import dev.obsidian.coredata.db.PlayEventEntity
import dev.obsidian.coredata.db.PlaylistDao
import dev.obsidian.coredata.db.PlaylistEntity
import dev.obsidian.coredata.db.PlaylistRow
import dev.obsidian.coredata.db.StatsDao
import dev.obsidian.coredata.db.TrackDao
import dev.obsidian.coredata.db.TrackEntity
import dev.obsidian.coredata.db.TrackWithStats
import dev.obsidian.coredata.model.Album
import dev.obsidian.coredata.model.Artist
import dev.obsidian.coredata.model.Playlist
import dev.obsidian.coredata.model.Track
import dev.obsidian.coredata.scanner.MediaScanner
import dev.obsidian.coredata.scanner.ScanResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MusicRepository @Inject constructor(
    private val trackDao: TrackDao,
    private val statsDao: StatsDao,
    private val playlistDao: PlaylistDao,
    private val historyDao: HistoryDao,
    private val scanner: MediaScanner,
) {

    val tracks: Flow<List<Track>> = trackDao.observeAll().map { rows -> rows.map { it.toTrack() } }
    val albums: Flow<List<Album>> = trackDao.observeAlbums().map { rows -> rows.map { it.toAlbum() } }
    val artists: Flow<List<Artist>> = trackDao.observeArtists().map { rows -> rows.map { it.toArtist() } }
    val folders: Flow<List<String>> = trackDao.observeFolders()
    val playlists: Flow<List<Playlist>> = playlistDao.observeAll().map { rows -> rows.map { it.toPlaylist() } }
    val trackCount: Flow<Int> = trackDao.observeCount()
    val favorites: Flow<Set<Long>> = statsDao.observeFavorites().map { it.toSet() }

    val recentlyAdded: Flow<List<Track>> = trackDao.recentlyAdded().map { it.map { r -> r.toTrack() } }
    val mostPlayed: Flow<List<Track>> = trackDao.mostPlayed().map { it.map { r -> r.toTrack() } }
    val neverPlayed: Flow<List<Track>> = trackDao.neverPlayed().map { it.map { r -> r.toTrack() } }
    val recentlyPlayed: Flow<List<Track>> = statsDao.recentlyPlayed().map { it.map { e -> e.toTrack() } }

    fun search(query: String): Flow<List<Track>> =
        trackDao.search(query).map { rows -> rows.map { it.toTrack() } }

    fun albumTracks(albumId: Long): Flow<List<Track>> =
        trackDao.observeAlbumTracks(albumId).map { rows -> rows.map { it.toTrack() } }

    fun artistTracks(artistId: Long): Flow<List<Track>> =
        trackDao.observeArtistTracks(artistId).map { rows -> rows.map { it.toTrack() } }

    fun playlistTracks(playlistId: Long): Flow<List<Track>> =
        playlistDao.observeTracks(playlistId).map { rows -> rows.map { it.toTrack() } }

    fun track(id: Long): Flow<Track?> = trackDao.observeTrack(id).map { it.firstOrNull()?.toTrack() }

    /** Rescans the device and reconciles the table in one pass. */
    suspend fun scan(): ScanResult {
        val result = scanner.scan()
        trackDao.upsert(result.tracks)
        val keep = result.tracks.map { it.id }
        if (keep.isNotEmpty()) trackDao.deleteExcept(keep)
        return result
    }

    suspend fun toggleFavorite(trackId: Long): Boolean = statsDao.toggleFavorite(trackId)

    suspend fun recordPlay(trackId: Long) {
        statsDao.recordPlay(trackId, System.currentTimeMillis())
        historyDao.insert(PlayEventEntity(trackId = trackId))
    }

    suspend fun createPlaylist(name: String, trackIds: List<Long> = emptyList()): Long {
        val id = playlistDao.insert(PlaylistEntity(name = name))
        if (trackIds.isNotEmpty()) playlistDao.setTracks(id, trackIds)
        return id
    }

    suspend fun renamePlaylist(id: Long, name: String) = playlistDao.rename(id, name)

    suspend fun deletePlaylist(id: Long) {
        playlistDao.clearEntries(id)
        playlistDao.delete(id)
    }

    suspend fun setPlaylistTracks(id: Long, trackIds: List<Long>) = playlistDao.setTracks(id, trackIds)

    suspend fun addToPlaylist(id: Long, trackIds: List<Long>) {
        val start = playlistDao.maxPosition(id) + 1
        trackIds.forEachIndexed { index, trackId ->
            playlistDao.insertEntries(
                listOf(
                    dev.obsidian.coredata.db.PlaylistTrackEntity(
                        playlistId = id,
                        trackId = trackId,
                        position = start + index,
                    ),
                ),
            )
        }
    }
}

internal fun TrackWithStats.toTrack(): Track = Track(
    id = track.id,
    uri = track.uri,
    title = track.title,
    artist = track.artist,
    artistId = track.artistId,
    album = track.album,
    albumId = track.albumId,
    durationMs = track.durationMs,
    trackNumber = track.trackNumber,
    year = track.year,
    genre = track.genre,
    folder = track.folder,
    mimeType = track.mimeType,
    sampleRateHz = track.sampleRateHz,
    bitsPerSample = track.bitsPerSample,
    addedAtSec = track.addedAtSec,
    artUri = track.artUri,
    hasEmbeddedArt = track.hasEmbeddedArt,
    isFavorite = stats?.favorite ?: false,
    playCount = stats?.playCount ?: 0,
    lastPlayedAt = stats?.lastPlayedAt ?: 0L,
)

internal fun TrackEntity.toTrack(): Track = Track(
    id = id,
    uri = uri,
    title = title,
    artist = artist,
    artistId = artistId,
    album = album,
    albumId = albumId,
    durationMs = durationMs,
    trackNumber = trackNumber,
    year = year,
    genre = genre,
    folder = folder,
    mimeType = mimeType,
    sampleRateHz = sampleRateHz,
    bitsPerSample = bitsPerSample,
    addedAtSec = addedAtSec,
    artUri = artUri,
    hasEmbeddedArt = hasEmbeddedArt,
)

private fun AlbumRow.toAlbum(): Album = Album(
    id = id, title = title, artist = artist, year = year,
    artUri = artUri, trackCount = trackCount, durationMs = durationMs,
)

private fun ArtistRow.toArtist(): Artist = Artist(
    id = id, name = name, albumCount = albumCount, trackCount = trackCount, artUri = artUri,
)

private fun PlaylistRow.toPlaylist(): Playlist = Playlist(
    id = id, name = name, trackCount = trackCount, artUri = artUri, createdAt = createdAt,
)
