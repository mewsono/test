package dev.obsidian.coreui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

/**
 * The one place colour, type and shape are decided. Forced dark: Obsidian has
 * no light theme, and every ambient surface is pure black so OLED pixels rest.
 */
@Composable
fun ObsidianTheme(
    accent: Color = AccentChoice.Default.color,
    content: @Composable () -> Unit,
) {
    val scheme = darkColorScheme(
        primary = accent,
        onPrimary = Color.Black,
        primaryContainer = accent.copy(alpha = 0.14f),
        onPrimaryContainer = accent,
        inversePrimary = accent,
        secondary = accent,
        onSecondary = Color.Black,
        secondaryContainer = ObsidianColors.Surface2,
        onSecondaryContainer = ObsidianColors.TextPrimary,
        tertiary = ObsidianColors.TextSecondary,
        onTertiary = ObsidianColors.Black,
        background = ObsidianColors.Black,
        onBackground = ObsidianColors.TextPrimary,
        surface = ObsidianColors.Black,
        onSurface = ObsidianColors.TextPrimary,
        surfaceVariant = ObsidianColors.Surface2,
        onSurfaceVariant = ObsidianColors.TextSecondary,
        surfaceTint = Color.Transparent,
        surfaceContainerLowest = ObsidianColors.Black,
        surfaceContainerLow = ObsidianColors.Surface1,
        surfaceContainer = ObsidianColors.Surface1,
        surfaceContainerHigh = ObsidianColors.Surface2,
        surfaceContainerHighest = ObsidianColors.Surface3,
        outline = ObsidianColors.Hairline,
        outlineVariant = ObsidianColors.Hairline,
        error = ObsidianColors.Error,
        onError = ObsidianColors.OnError,
        scrim = ObsidianColors.Scrim,
    )

    CompositionLocalProvider(
        LocalAccent provides Accent(color = accent, onAccent = Color.Black),
    ) {
        MaterialTheme(
            colorScheme = scheme,
            typography = ObsidianTypography,
            shapes = ObsidianShapes,
            content = content,
        )
    }
}
