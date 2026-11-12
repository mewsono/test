package dev.obsidian.coreui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/** Cards 22–28dp, chips and buttons fully round, album art 32dp. */
val ObsidianShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

val AlbumArtShape = RoundedCornerShape(32.dp)
val CardShape = RoundedCornerShape(22.dp)
val SheetShape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
val PillShape = RoundedCornerShape(percent = 50)

object ObsidianSizes {
    /** minimum touch target everywhere */
    val TouchTarget = 48.dp
    val AccentButton = 76.dp
    val MiniPlayerHeight = 64.dp
    val NavBarHeight = 68.dp
    val SeekThumb = 14.dp
    val SeekTrack = 4.dp
}
