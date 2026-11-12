package dev.obsidian.feature.player.playback

import android.app.PendingIntent
import android.content.Intent
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import dagger.hilt.android.AndroidEntryPoint
import dev.obsidian.coredata.repository.MusicRepository
import dev.obsidian.coredata.settings.SettingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * The single owner of ExoPlayer. Runs in the foreground for the duration of playback,
 * publishes a [MediaSession] so the lock screen, notification, Bluetooth buttons and
 * Android Auto all drive the same queue.
 */
@AndroidEntryPoint
class ObsidianPlaybackService : MediaSessionService() {

    @Inject lateinit var repository: MusicRepository
    @Inject lateinit var settingsRepository: SettingsRepository

    private lateinit var player: ExoPlayer
    private var session: MediaSession? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var playCountJob: Job? = null

    override fun onCreate() {
        super.onCreate()

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                /* handleAudioFocus = */ true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setPauseAtEndOfMediaItems(false)
            .build()

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) {
                    AudioEffects.onSession(player.audioSessionId)
                }
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                countPlayAfterDwell(mediaItem)
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                if (!isPlaying) persistPosition()
            }
        })

        session = MediaSession.Builder(this, player)
            .setSessionActivity(launchIntent())
            .setCallback(object : MediaSession.Callback {
                // Media items already carry the content:// uri, so nothing to resolve.
                override fun onAddMediaItems(
                    mediaSession: MediaSession,
                    controller: MediaSession.ControllerInfo,
                    mediaItems: MutableList<MediaItem>,
                ): ListenableFuture<MutableList<MediaItem>> = Futures.immediateFuture(mediaItems)
            })
            .build()

        AudioEffects.attachPlayer(player)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onTaskRemoved(rootIntent: Intent?) {
        if (player.mediaItemCount == 0 || !player.playWhenReady) {
            stopSelf()
        }
    }

    override fun onDestroy() {
        persistPosition()
        AudioEffects.release()
        session?.release()
        session = null
        player.release()
        scope.coroutineContext.cancel()
        super.onDestroy()
    }

    private fun launchIntent(): PendingIntent? {
        val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        return PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    /** A play is only counted once the listener actually sat with the track for 20 seconds. */
    private fun countPlayAfterDwell(mediaItem: MediaItem?) {
        playCountJob?.cancel()
        val id = mediaItem?.mediaId?.toLongOrNull() ?: return
        playCountJob = scope.launch {
            delay(20_000)
            if (player.currentMediaItem?.mediaId == id.toString() && player.isPlaying) {
                runCatching { repository.recordPlay(id) }
            }
        }
    }

    private fun persistPosition() {
        val id = player.currentMediaItem?.mediaId?.toLongOrNull() ?: return
        val position = player.currentPosition.coerceAtLeast(0)
        scope.launch { runCatching { settingsRepository.saveResumePoint(id, position) } }
    }
}
