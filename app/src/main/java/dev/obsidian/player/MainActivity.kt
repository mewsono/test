package dev.obsidian.player

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.obsidian.coreui.component.AlbumArt
import dev.obsidian.coreui.component.BarsIndicator
import dev.obsidian.coreui.component.Eyebrow
import dev.obsidian.coreui.component.Hairline
import dev.obsidian.coreui.component.ObsidianIconButton
import dev.obsidian.coreui.component.ObsidianPill
import dev.obsidian.coreui.component.ObsidianSeekBar
import dev.obsidian.coreui.theme.AccentChoice
import dev.obsidian.coreui.theme.ObsidianColors
import dev.obsidian.coreui.theme.ObsidianSizes
import dev.obsidian.coreui.theme.ObsidianTheme
import dev.obsidian.coreui.theme.accentColor
import dev.obsidian.coredata.model.Track
import dev.obsidian.feature.player.playback.PlayerUiState

/**
 * Single activity. The full navigation graph (Now Playing, Library, Queue, Lyrics,
 * Equalizer, Home, Search, detail and settings) hangs off this; today it shows the
 * library slice so the theme, the database and the session are proven end to end.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: MainViewModel = hiltViewModel()
            val settings by viewModel.settings.collectAsStateWithLifecycle()
            val accent = AccentChoice.fromKey(settings.accentKey).color

            ObsidianTheme(accent = accent) {
                Surface(modifier = Modifier.fillMaxSize(), color = ObsidianColors.Black) {
                    LibraryShell(viewModel)
                }
            }
        }
    }
}

@Suppress("DEPRECATION")
private fun audioPermission(): String =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_AUDIO
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }

@Composable
private fun LibraryShell(viewModel: MainViewModel) {
    val context = LocalContext.current
    val tracks by viewModel.tracks.collectAsStateWithLifecycle()
    val player by viewModel.player.collectAsStateWithLifecycle()
    val positionMs by viewModel.playerPosition.collectAsStateWithLifecycle()
    val scanning by viewModel.scanning.collectAsStateWithLifecycle()

    var granted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, audioPermission()) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED,
        )
    }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { allowed ->
        granted = allowed
        if (allowed) viewModel.scan()
    }

    LaunchedEffect(granted) {
        viewModel.playback.connect()
        if (granted && tracks.isEmpty()) viewModel.scan()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ObsidianColors.Black)
            .windowInsetsPadding(WindowInsets.statusBars),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 12.dp, top = 12.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Library",
                    style = MaterialTheme.typography.headlineLarge,
                    color = ObsidianColors.TextPrimary,
                )
                Text(
                    text = if (tracks.isEmpty()) "Nothing scanned yet" else "${tracks.size} songs",
                    style = MaterialTheme.typography.bodySmall,
                    color = ObsidianColors.TextSecondary,
                )
            }
            ObsidianIconButton(
                icon = Icons.Rounded.Refresh,
                contentDescription = "Rescan device",
                enabled = granted && !scanning,
                onClick = { viewModel.scan() },
            )
        }

        Hairline()

        when {
            !granted -> PermissionBlock { launcher.launch(audioPermission()) }

            tracks.isEmpty() -> Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                EmptyBlock(scanning = scanning, onScan = { viewModel.scan() })
            }

            else -> LazyColumn(modifier = Modifier.weight(1f)) {
                item { Spacer(Modifier.height(8.dp)) }
                items(items = tracks, key = { it.id }) { track ->
                    TrackRow(
                        track = track,
                        player = player,
                        onClick = { viewModel.play(tracks.indexOf(track)) },
                    )
                }
                item { Spacer(Modifier.height(12.dp)) }
            }
        }

        if (player.mediaId != null) {
            MiniPlayer(
                player = player,
                positionMs = positionMs,
                onToggle = viewModel.playback::playPause,
            )
        }
    }
}

@Composable
private fun TrackRow(track: Track, player: PlayerUiState, onClick: () -> Unit) {
    val isCurrent = player.mediaId == track.id.toString()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .clickable(onClick = onClick)
            .padding(horizontal = 24.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AlbumArt(
            data = track.artUri,
            size = 48.dp,
            corner = 8.dp,
            contentDescription = "Artwork for ${track.album}",
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(start = 14.dp),
        ) {
            Text(
                text = track.title,
                style = MaterialTheme.typography.titleSmall,
                color = if (isCurrent) accentColor else ObsidianColors.TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = track.artist,
                style = MaterialTheme.typography.bodySmall,
                color = ObsidianColors.TextSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (isCurrent) {
            BarsIndicator(playing = player.isPlaying, modifier = Modifier.padding(start = 8.dp))
        }
    }
}

@Composable
private fun MiniPlayer(player: PlayerUiState, positionMs: Long, onToggle: () -> Unit) {
    Column(modifier = Modifier.windowInsetsPadding(WindowInsets.navigationBars)) {
        Hairline()
        ObsidianSeekBar(
            progress = {
                if (player.durationMs <= 0) 0f
                else (positionMs / player.durationMs.toFloat()).coerceIn(0f, 1f)
            },
            onSeek = {},
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(ObsidianSizes.MiniPlayerHeight)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AlbumArt(data = player.artUri, size = 44.dp, corner = 8.dp, contentDescription = null)
            Column(
                Modifier
                    .weight(1f)
                    .padding(start = 12.dp),
            ) {
                Text(
                    text = player.title.ifBlank { "Nothing playing" },
                    style = MaterialTheme.typography.titleSmall,
                    color = ObsidianColors.TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = player.artist,
                    style = MaterialTheme.typography.bodySmall,
                    color = ObsidianColors.TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            ObsidianIconButton(
                icon = if (player.isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                contentDescription = if (player.isPlaying) "Pause" else "Play",
                tint = accentColor,
                onClick = onToggle,
            )
        }
    }
}

@Composable
private fun PermissionBlock(onRequest: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Eyebrow("Permission")
        Text(
            text = "Obsidian plays the audio already on this device.",
            style = MaterialTheme.typography.headlineSmall,
            color = ObsidianColors.TextPrimary,
        )
        Text(
            text = "Nothing is uploaded and the app has no network access at all.",
            style = MaterialTheme.typography.bodyMedium,
            color = ObsidianColors.TextSecondary,
        )
        Spacer(Modifier.height(8.dp))
        ObsidianPill(text = "Allow audio access", onClick = onRequest)
    }
}

@Composable
private fun EmptyBlock(scanning: Boolean, onScan: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = if (scanning) "Scanning…" else "No audio found",
                style = MaterialTheme.typography.titleMedium,
                color = ObsidianColors.TextPrimary,
            )
            if (!scanning) {
                ObsidianPill(text = "Scan device", onClick = onScan)
            }
        }
    }
}
