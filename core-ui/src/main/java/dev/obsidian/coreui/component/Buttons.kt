package dev.obsidian.coreui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.obsidian.coreui.theme.LocalAccent
import dev.obsidian.coreui.theme.ObsidianColors
import dev.obsidian.coreui.theme.ObsidianSizes
import dev.obsidian.coreui.theme.PillShape

/**
 * Every icon action in Obsidian goes through here: a 48dp touch target, a
 * mandatory TalkBack label, and an optional selected/on state that is the only
 * place accent colour may appear.
 */
@Composable
fun ObsidianIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = ObsidianColors.TextPrimary,
    iconSize: Dp = 24.dp,
    enabled: Boolean = true,
) {
    val interaction = remember { MutableInteractionSource() }
    Box(
        modifier = modifier
            .size(ObsidianSizes.TouchTarget)
            .clip(CircleShape)
            .clickable(
                interactionSource = interaction,
                indication = androidx.compose.material3.ripple(),
                enabled = enabled,
                role = Role.Button,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = if (enabled) tint else tint.copy(alpha = 0.38f),
            modifier = Modifier.size(iconSize),
        )
    }
}

/** The 76dp accent play/pause target. */
@Composable
fun AccentPlayButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    playing: Boolean = false,
) {
    val accent = LocalAccent.current
    Box(
        modifier = modifier
            .size(ObsidianSizes.AccentButton)
            .clip(CircleShape)
            .background(accent.color)
            .clickable(role = Role.Button, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = accent.onAccent,
            modifier = Modifier.size(if (playing) 32.dp else 34.dp),
        )
    }
}

/** Pill used for filters, "Shuffle all", quality badges and list actions. */
@Composable
fun ObsidianPill(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    icon: ImageVector? = null,
    contentDescription: String? = null,
) {
    val accent = LocalAccent.current
    Row(
        modifier = modifier
            .defaultMinSize(minHeight = ObsidianSizes.TouchTarget)
            .clip(PillShape)
            .background(if (selected) accent.color else Color.Transparent)
            .border(
                width = 1.dp,
                color = if (selected) Color.Transparent else ObsidianColors.Hairline,
                shape = PillShape,
            )
            .clickable(role = Role.Button, onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (selected) accent.onAccent else ObsidianColors.TextPrimary,
                modifier = Modifier.size(18.dp),
            )
        }
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) accent.onAccent else ObsidianColors.TextPrimary,
        )
    }
}

/** Read-only badge, e.g. "FLAC · 24/96" between the two timecodes. */
@Composable
fun QualityChip(text: String, modifier: Modifier = Modifier) {
    val accent = LocalAccent.current
    Box(
        modifier = modifier
            .clip(PillShape)
            .border(1.dp, ObsidianColors.Hairline, PillShape)
            .padding(horizontal = 10.dp, vertical = 3.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = accent.color,
        )
    }
}
