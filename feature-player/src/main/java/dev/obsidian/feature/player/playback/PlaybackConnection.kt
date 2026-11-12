package dev.obsidian.feature.player.playback

import android.content.ComponentName
import android.content.Context
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import dev.obsidian.coredata.model.RepeatMode
import dev.obsidian.coredata.model.Track
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/** Everything the UI needs to draw the player, pushed from the session. */
data class PlayerUiState(
    val mediaId: String? = null,
    val title: String = "",
    val artist: String = "",
    val album: String = "",
    val artUri: String? = null,
    val isPlaying: Boolean = false,
    val durationMs: Long = 0L,
    val shuffle: Boolean = false,
    val repeatMode: RepeatMode = RepeatMode.Off,
    val hasNext: Boolean = false,
    val hasPrevious: Boolean = false,
    val connected: Boolean = false,
)

/**
 * A thin, UI-friendly facade over the [MediaController]. The screens talk to this;
 * nothing outside the service touches ExoPlayer directly.
 */
@Singleton
class PlaybackConnection @Inject constructor(
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: Context,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private var future: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null

    private val _state = MutableStateFlow(PlayerUiState())
    val state: StateFlow<PlayerUiState> = _state.asStateFlow()

    /** Position is published separately so the seek bar can consume it without recomposing. */
    private val _positionMs = MutableStateFlow(0L)
    val positionMs: StateFlow<Long> = _positionMs.asStateFlow()

    private val _queue = MutableStateFlow<List<MediaItem>>(emptyList())
    val queue: StateFlow<List<MediaItem>> = _queue.asStateFlow()

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) {
            publish(player)
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            controller?.let { publish(it) }
            _positionMs.value = 0L
        }
    }

    fun connect() {
        if (controller != null || future != null) return
        val token = SessionToken(context, ComponentName(context, ObsidianPlaybackService::class.java))
        val f = MediaController.Builder(context, token).buildAsync()
        future = f
        f.addListener(
            {
                val c = runCatching { f.get() }.getOrNull() ?: return@addListener
                controller = c
                c.addListener(listener)
                publish(c)
                startPositionTicker()
            },
            ContextCompat.getMainExecutor(context),
        )
    }

    fun release() {
        controller?.removeListener(listener)
        controller = null
        future?.let { MediaController.releaseFuture(it) }
        future = null
        _state.value = PlayerUiState()
    }

    private fun startPositionTicker() {
        scope.launch {
            while (true) {
                val c = controller
                if (c != null && c.isPlaying) {
                    _positionMs.value = c.currentPosition.coerceAtLeast(0)
                }
                delay(200)
            }
        }
    }

    private fun publish(player: Player) {
        val item = player.currentMediaItem
        val meta = item?.mediaMetadata
        _state.value = PlayerUiState(
            mediaId = item?.mediaId,
            title = meta?.title?.toString().orEmpty(),
            artist = meta?.artist?.toString().orEmpty(),
            album = meta?.albumTitle?.toString().orEmpty(),
            artUri = meta?.artworkUri?.toString(),
            isPlaying = player.isPlaying,
            durationMs = player.duration.coerceAtLeast(0),
            shuffle = player.shuffleModeEnabled,
            repeatMode = player.repeatMode.toRepeat(),
            hasNext = player.hasNextMediaItem(),
            hasPrevious = player.hasPreviousMediaItem(),
            connected = true,
        )
        _queue.value = (0 until player.mediaItemCount).map { player.getMediaItemAt(it) }
        if (!player.isPlaying) _positionMs.value = player.currentPosition.coerceAtLeast(0)
    }

    /* ---- commands ---- */

    fun playPause() {
        val c = controller ?: return
        if (c.isPlaying) c.pause() else c.play()
    }

    fun play() { controller?.play() }
    fun pause() { controller?.pause() }

    fun next() { controller?.seekToNextMediaItem() }
    fun previous() { controller?.seekToPreviousMediaItem() }

    fun seekTo(ms: Long) {
        val c = controller ?: return
        c.seekTo(ms.coerceIn(0, c.duration.coerceAtLeast(0)))
        _positionMs.value = ms
    }

    fun toggleShuffle() {
        val c = controller ?: return
        c.shuffleModeEnabled = !c.shuffleModeEnabled
    }

    fun cycleRepeat() {
        val c = controller ?: return
        c.repeatMode = when (c.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
    }

    /**
     * Replaces the queue and starts at [startIndex]. Items are built from [Track]s so the
     * session keeps artwork and metadata for the lock screen without a second lookup.
     */
    fun playTracks(tracks: List<Track>, startIndex: Int = 0, shuffle: Boolean = false) {
        val c = controller ?: return
        if (tracks.isEmpty()) return
        c.setMediaItems(tracks.map { it.toMediaItem() }, startIndex.coerceIn(0, tracks.lastIndex), 0L)
        c.shuffleModeEnabled = shuffle
        c.prepare()
        c.play()
    }

    fun playNext(track: Track) {
        val c = controller ?: return
        val index = (c.currentMediaItemIndex + 1).coerceAtMost(c.mediaItemCount)
        c.addMediaItem(index, track.toMediaItem())
    }

    fun addToQueue(track: Track) {
        controller?.addMediaItem(track.toMediaItem())
    }

    fun removeFromQueue(index: Int) {
        val c = controller ?: return
        if (index in 0 until c.mediaItemCount) c.removeMediaItem(index)
    }

    fun moveInQueue(from: Int, to: Int) {
        controller?.moveMediaItem(from, to.coerceIn(0, (controller?.mediaItemCount ?: 1) - 1))
    }

    fun clearQueue() {
        controller?.let {
            it.stop()
            it.clearMediaItems()
        }
    }

    fun seekToQueueItem(index: Int) {
        controller?.seekToDefaultPosition(index)
    }
}

fun RepeatMode.toPlayerMode(): Int = when (this) {
    RepeatMode.Off -> Player.REPEAT_MODE_OFF
    RepeatMode.All -> Player.REPEAT_MODE_ALL
    RepeatMode.One -> Player.REPEAT_MODE_ONE
}

fun Int.toRepeat(): RepeatMode = when (this) {
    Player.REPEAT_MODE_ALL -> RepeatMode.All
    Player.REPEAT_MODE_ONE -> RepeatMode.One
    else -> RepeatMode.Off
}

fun Track.toMediaItem(): MediaItem = MediaItem.Builder()
    .setMediaId(id.toString())
    .setUri(uri)
    .setMediaMetadata(
        MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .setAlbumTitle(album)
            .setArtworkUri(artUri?.let { android.net.Uri.parse(it) })
            .setIsBrowsable(false)
            .setIsPlayable(true)
            .build(),
    )
    .build()
