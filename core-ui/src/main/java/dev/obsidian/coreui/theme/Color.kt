package dev.obsidian.coreui.theme

import androidx.compose.ui.graphics.Color

/**
 * Obsidian is an OLED player: true #000000 is the canvas, never a dark grey.
 * Surfaces sit a few steps above it and are used sparingly.
 *
 * Contrast on black (WCAG AAA needs 7:1, AA needs 4.5:1):
 *   TextPrimary   #F4F4F5  ~19.0:1
 *   TextSecondary #9A9AA3  ~ 7.4:1
 *   TextTertiary  #8A8A93  ~ 6.0:1
 */
object ObsidianColors {
    /** the canvas — must stay pure black so OLED pixels switch off */
    val Black = Color(0xFF000000)

    /** raised surfaces */
    val Surface1 = Color(0xFF0A0A0C)
    val Surface2 = Color(0xFF101013)
    val Surface3 = Color(0xFF121215)

    /** 1dp separators */
    val Hairline = Color(0xFF1C1C20)

    /** text */
    val TextPrimary = Color(0xFFF4F4F5)
    val TextSecondary = Color(0xFF9A9AA3)
    val TextTertiary = Color(0xFF8A8A93)

    /** control wells (seek track, slider groove) */
    val TrackIdle = Color(0xFF2A2A2F)

    /** overlay scrim for sheets */
    val Scrim = Color(0xCC000000)

    val Error = Color(0xFFFF6B6B)
    val OnError = Color(0xFF1A0000)
}
