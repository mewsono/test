package dev.obsidian.coredata.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dev.obsidian.coredata.model.FocusBehavior
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

data class AppSettings(
    val accentKey: String = "lime",
    val adaptiveAccent: Boolean = false,
    val gapless: Boolean = true,
    val crossfadeSeconds: Int = 0,
    val replayGain: Boolean = false,
    val focusBehavior: FocusBehavior = FocusBehavior.Pause,
    val minTrackLengthSec: Int = 30,
    val includedFolders: Set<String> = emptySet(),
    val excludedFolders: Set<String> = emptySet(),
    val playbackSpeed: Float = 1f,
    val showQualityChip: Boolean = true,
    val compactRows: Boolean = false,
    val lastTrackId: Long = -1L,
    val lastPositionMs: Long = 0L,
)

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("obsidian_settings")

class SettingsRepository(private val context: Context) {

    private object Keys {
        val accent = stringPreferencesKey("accent")
        val adaptive = booleanPreferencesKey("adaptive_accent")
        val gapless = booleanPreferencesKey("gapless")
        val crossfade = intPreferencesKey("crossfade_seconds")
        val replayGain = booleanPreferencesKey("replay_gain")
        val focus = stringPreferencesKey("focus_behavior")
        val minLength = intPreferencesKey("min_track_length")
        val included = stringSetPreferencesKey("included_folders")
        val excluded = stringSetPreferencesKey("excluded_folders")
        val speed = floatPreferencesKey("playback_speed")
        val qualityChip = booleanPreferencesKey("quality_chip")
        val compactRows = booleanPreferencesKey("compact_rows")
        val lastTrack = intPreferencesKey("last_track")
        val lastPosition = intPreferencesKey("last_position")
    }

    val settings: Flow<AppSettings> = context.dataStore.data.map { p ->
        AppSettings(
            accentKey = p[Keys.accent] ?: "lime",
            adaptiveAccent = p[Keys.adaptive] ?: false,
            gapless = p[Keys.gapless] ?: true,
            crossfadeSeconds = p[Keys.crossfade] ?: 0,
            replayGain = p[Keys.replayGain] ?: false,
            focusBehavior = runCatching {
                FocusBehavior.valueOf(p[Keys.focus] ?: FocusBehavior.Pause.name)
            }.getOrDefault(FocusBehavior.Pause),
            minTrackLengthSec = p[Keys.minLength] ?: 30,
            includedFolders = p[Keys.included] ?: emptySet(),
            excludedFolders = p[Keys.excluded] ?: emptySet(),
            playbackSpeed = p[Keys.speed] ?: 1f,
            showQualityChip = p[Keys.qualityChip] ?: true,
            compactRows = p[Keys.compactRows] ?: false,
            lastTrackId = (p[Keys.lastTrack] ?: -1).toLong(),
            lastPositionMs = (p[Keys.lastPosition] ?: 0).toLong(),
        )
    }

    suspend fun setAccent(key: String) = edit { it[Keys.accent] = key }
    suspend fun setAdaptiveAccent(enabled: Boolean) = edit { it[Keys.adaptive] = enabled }
    suspend fun setGapless(enabled: Boolean) = edit { it[Keys.gapless] = enabled }
    suspend fun setCrossfade(seconds: Int) = edit { it[Keys.crossfade] = seconds.coerceIn(0, 12) }
    suspend fun setReplayGain(enabled: Boolean) = edit { it[Keys.replayGain] = enabled }
    suspend fun setFocusBehavior(behavior: FocusBehavior) = edit { it[Keys.focus] = behavior.name }
    suspend fun setMinTrackLength(seconds: Int) = edit { it[Keys.minLength] = seconds.coerceIn(0, 600) }
    suspend fun setIncludedFolders(folders: Set<String>) = edit { it[Keys.included] = folders }
    suspend fun setExcludedFolders(folders: Set<String>) = edit { it[Keys.excluded] = folders }
    suspend fun setPlaybackSpeed(speed: Float) = edit { it[Keys.speed] = speed.coerceIn(0.5f, 2f) }
    suspend fun setShowQualityChip(show: Boolean) = edit { it[Keys.qualityChip] = show }
    suspend fun setCompactRows(compact: Boolean) = edit { it[Keys.compactRows] = compact }

    suspend fun saveResumePoint(trackId: Long, positionMs: Long) = edit {
        it[Keys.lastTrack] = trackId.toInt()
        it[Keys.lastPosition] = positionMs.toInt()
    }

    private suspend fun edit(block: (androidx.datastore.preferences.core.MutablePreferences) -> Unit) {
        context.dataStore.edit(block)
    }
}
