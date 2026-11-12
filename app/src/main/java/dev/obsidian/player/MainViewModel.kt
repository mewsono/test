package dev.obsidian.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dev.obsidian.coredata.model.Track
import dev.obsidian.coredata.repository.MusicRepository
import dev.obsidian.coredata.settings.AppSettings
import dev.obsidian.coredata.settings.SettingsRepository
import dev.obsidian.feature.player.playback.PlaybackConnection
import dev.obsidian.feature.player.playback.PlayerUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: MusicRepository,
    private val settingsRepository: SettingsRepository,
    val playback: PlaybackConnection,
) : ViewModel() {

    val settings: StateFlow<AppSettings> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.Eagerly, AppSettings())

    val tracks: StateFlow<List<Track>> = repository.tracks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val player: StateFlow<PlayerUiState> = playback.state

    /** Ticks four times a second; consumed in the draw phase so nothing recomposes. */
    val playerPosition: StateFlow<Long> = playback.positionMs

    private val _scanning = MutableStateFlow(false)
    val scanning: StateFlow<Boolean> = _scanning.asStateFlow()

    fun scan() {
        if (_scanning.value) return
        viewModelScope.launch {
            _scanning.value = true
            runCatching { repository.scan() }
            _scanning.value = false
        }
    }

    fun play(index: Int) = playback.playTracks(tracks.value, index)

    fun toggleFavorite(track: Track) {
        // Favourites only ever come from the accent heart, never from a row tap.
        viewModelScope.launch { repository.toggleFavorite(track.id) }
    }
}
