package dev.obsidian.feature.player.playback

import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.abs

/**
 * Owns the platform effects for whichever audio session ExoPlayer is currently using.
 *
 * One caveat worth knowing: on devices where a vendor "sound enhancer" (Dolby, Dirac,
 * OPlus Audio) has taken over the session, these effects can be ignored or fight with
 * it. Every call is wrapped, so a device that refuses simply keeps the flat curve.
 */
object AudioEffects {

    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var loudness: LoudnessEnhancer? = null
    private var player: ExoPlayer? = null

    private val _sessionId = MutableStateFlow(0)
    val sessionId: StateFlow<Int> = _sessionId.asStateFlow()

    private val _enabled = MutableStateFlow(false)
    val enabled: StateFlow<Boolean> = _enabled.asStateFlow()

    /** Band levels in dB, in the device's own band order. */
    private val _levels = MutableStateFlow<List<Short>>(emptyList())
    val levels: StateFlow<List<Short>> = _levels.asStateFlow()

    private val _bandsHz = MutableStateFlow<List<Int>>(emptyList())
    val bandsHz: StateFlow<List<Int>> = _bandsHz.asStateFlow()

    private val _bassStrength = MutableStateFlow(0)
    val bassStrength: StateFlow<Int> = _bassStrength.asStateFlow()

    private val _loudnessGain = MutableStateFlow(0)
    val loudnessGain: StateFlow<Int> = _loudnessGain.asStateFlow()

    val presetNames: List<String>
        get() = runCatching {
            val eq = equalizer ?: return emptyList()
            (0 until eq.numberOfPresets.toInt()).map { eq.getPresetName(it.toShort()).toString() }
        }.getOrDefault(emptyList())

    fun attachPlayer(exo: ExoPlayer) {
        player = exo
        onSession(exo.audioSessionId)
    }

    fun onSession(id: Int) {
        if (id == 0 || id == AudioEffectSessionGuard.last) return
        release()
        AudioEffectSessionGuard.last = id
        _sessionId.value = id
        runCatching {
            val eq = Equalizer(0, id)
            equalizer = eq
            _bandsHz.value = (0 until eq.numberOfBands.toInt()).map { eq.getBandFreq(it.toShort()).toInt() / 1000 }
            _levels.value = (0 until eq.numberOfBands.toInt()).map { eq.getBandLevel(it.toShort()) }
            eq.enabled = _enabled.value
        }
        runCatching {
            val bb = BassBoost(0, id)
            bassBoost = bb
            bb.enabled = _enabled.value
        }
        runCatching {
            val le = LoudnessEnhancer(id)
            loudness = le
            le.enabled = _enabled.value
        }
    }

    fun setEnabled(on: Boolean) {
        _enabled.value = on
        runCatching { equalizer?.enabled = on }
        runCatching { bassBoost?.enabled = on && _bassStrength.value > 0 }
        runCatching { loudness?.enabled = on && _loudnessGain.value > 0 }
    }

    /** [db] is clamped to the band's own range, so all devices stay inside their limits. */
    fun setBand(index: Int, db: Int) {
        val eq = equalizer ?: return
        runCatching {
            val range = eq.bandLevelRange
            val clamped = db.coerceIn(range[0].toInt(), range[1].toInt()).toShort()
            eq.setBandLevel(index.toShort(), clamped)
            _levels.value = _levels.value.toMutableList().also { it[index] = clamped }
        }
    }

    fun setBassStrength(strength: Int) {
        _bassStrength.value = strength
        runCatching {
            bassBoost?.setStrength(strength.toShort())
            bassBoost?.enabled = _enabled.value && strength > 0
        }
    }

    fun setLoudnessGain(mb: Int) {
        _loudnessGain.value = mb
        runCatching {
            loudness?.setTargetGain(mb)
            loudness?.enabled = _enabled.value && mb > 0
        }
    }

    fun applyPreset(name: String) {
        val eq = equalizer ?: return
        runCatching {
            val index = (0 until eq.numberOfPresets.toInt()).firstOrNull {
                eq.getPresetName(it.toShort()).toString().equals(name, ignoreCase = true)
            } ?: return
            eq.usePreset(index.toShort())
            _levels.value = (0 until eq.numberOfBands.toInt()).map { eq.getBandLevel(it.toShort()) }
        }
    }

    /** Flat / Bass Boost / Vocal / Custom map onto the platform presets where they exist. */
    fun applyNamedPreset(preset: EqPreset) {
        if (preset == EqPreset.Custom) return
        val available = presetNames
        val target = preset.platformAlias.firstOrNull { alias ->
            available.any { it.equals(alias, ignoreCase = true) }
        }
        if (target != null && available.isNotEmpty()) {
            applyPreset(
                available.first { it.equals(target, ignoreCase = true) },
            )
        } else {
            applyCurve(preset.fallbackCurve)
        }
    }

    fun applyCurve(curve: List<Int>) {
        val bandCount = _levels.value.size
        if (bandCount == 0) return
        for (i in 0 until bandCount) {
            val db = curve.getOrElse(i * curve.size / bandCount) { 0 }
            setBand(i, db)
        }
    }

    fun reset() {
        runCatching { equalizer?.usePreset(0) }
        setBassStrength(0)
        setLoudnessGain(0)
        _levels.value = List(_levels.value.size) { 0 }
        runCatching {
            val eq = equalizer ?: return
            for (i in 0 until eq.numberOfBands.toInt()) eq.setBandLevel(i.toShort(), 0)
        }
    }

    fun release() {
        runCatching { equalizer?.release() }
        runCatching { bassBoost?.release() }
        runCatching { loudness?.release() }
        equalizer = null
        bassBoost = null
        loudness = null
        _bandsHz.value = emptyList()
        _levels.value = emptyList()
    }

    fun currentGainDb(index: Int): Int = _levels.value.getOrElse(index) { 0 }.toInt()
}

enum class EqPreset(val label: String, val platformAlias: List<String>, val fallbackCurve: List<Int>) {
    Flat("Flat", listOf("Normal", "Flat"), listOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
    BassBoost("Bass Boost", listOf("Bass Boost", "Bass Booster"), listOf(8, 6, 4, 2, 0, 0, 0, 0, 0, 0)),
    Vocal("Vocal", listOf("Vocal", "Vocal Booster"), listOf(-2, 0, 2, 4, 5, 4, 2, 0, -1, -2)),
    Custom("Custom", emptyList(), listOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
}

private object AudioEffectSessionGuard {
    var last: Int = -1
}

/** Small helper so the UI can render a dB label without float noise. */
fun Short.toDbLabel(): String {
    val db = this / 100f
    val rounded = (db * 10).toInt() / 10f
    return when {
        abs(rounded) < 0.05f -> "0"
        rounded > 0 -> "+${rounded.toString().removeSuffix(".0")}"
        else -> rounded.toString().removeSuffix(".0")
    }
}
