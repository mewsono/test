package dev.obsidian.coreui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * One accent, used only for: play button, seek fill, active chip, active nav
 * item, favourite heart, now-playing indicator. Nothing else.
 */
@Immutable
enum class AccentChoice(
    val key: String,
    val label: String,
    val color: Color,
) {
    Lime("lime", "Lime", Color(0xFFC8F542)),
    Aqua("aqua", "Aqua", Color(0xFF5EEAD4)),
    Coral("coral", "Coral", Color(0xFFFF8A5B)),
    Violet("violet", "Violet", Color(0xFFB69CFF)),
    ;

    companion object {
        val Default = Lime

        fun fromKey(key: String?): AccentChoice =
            entries.firstOrNull { it.key == key } ?: Default
    }
}

/** The resolved accent for the running theme (either chosen or lifted from artwork). */
@Immutable
data class Accent(
    val color: Color,
    /** black reads best on all four accents */
    val onAccent: Color = Color.Black,
    /** 14% wash for selected chips — never used as a large-area fill */
    val wash: Color = color.copy(alpha = 0.14f),
)

val LocalAccent = staticCompositionLocalOf { Accent(AccentChoice.Default.color) }

/** convenience for components that just need the colour */
val accentColor: Color
    @androidx.compose.runtime.Composable
    get() = LocalAccent.current.color
