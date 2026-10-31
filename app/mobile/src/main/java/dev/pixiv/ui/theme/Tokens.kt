package dev.pixiv.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Design tokens lifted straight from the approved design.
 * Every colour/measure in the app should come from here.
 */
object PixivColors {
    val Ink = Color(0xFF0B0A12)          // app background
    val Cream = Color(0xFFF3EBDD)        // primary text / light surfaces
    val Accent = Color(0xFFFF6B4A)       // coral — brand accent
    val Violet = Color(0xFF8F6BFF)       // gradient partner
    val Muted = Color(0xFFA59FB8)        // secondary text
    val Lavender = Color(0xFFD8D1E6)     // chip / tag text
    val Body = Color(0xFFC9C2D9)         // paragraph copy
    val LikeRed = Color(0xFFE5334F)
    val LikedRed = Color(0xFFFF3E63)

    val NavSurface = Color(0xCC1C1730)   // glass pill (80% of #1C1730)
    val Hairline = Color(0x24F3EBDD)     // rgba(243,235,221,.14)
    val Border = Color(0x33F3EBDD)       // rgba(243,235,221,.20)
    val BorderStrong = Color(0x73F3EBDD) // rgba(243,235,221,.45)
    val SurfaceTint = Color(0x0AF3EBDD)  // rgba(243,235,221,.04)
}

object PixivDimens {
    val ScreenPadding = 22.dp
    val CardRadius = 32.dp
    val NavRadius = 31.dp
    val NavHeight = 62.dp
    val ChipRadius = 22.dp
    val ChipHeight = 44.dp
    val IconButton = 44.dp
    val ActionButton = 48.dp
    val HeroHeight = 300.dp
    val HeroRadius = 32.dp
    val ThumbWidth = 124.dp
    val ThumbHeight = 200.dp
}

object PixivType {
    val Wordmark = 30.sp
    val Display = 34.sp
    val PageTitle = 36.sp
    val HeroTitle = 26.sp
    val SectionTitle = 27.sp
    val CardTitle = 20.sp
    val Stat = 21.sp
    val Eyebrow = 11.sp
    val Body = 14.sp
    val Caption = 13.sp
    val Micro = 12.sp
}
