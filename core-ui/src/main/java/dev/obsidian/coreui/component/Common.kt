package dev.obsidian.coreui.component

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import dev.obsidian.coreui.theme.ObsidianColors
import dev.obsidian.coreui.theme.accentColor

/**
 * Artwork loaded at 2× its display size: crisp on any density, and the disk
 * cache keeps scrolling cheap.
 */
@Composable
fun AlbumArt(
    data: Any?,
    size: Dp,
    modifier: Modifier = Modifier,
    corner: Dp = 12.dp,
    contentDescription: String? = null,
) {
    val context = LocalContext.current
    val px = with(LocalDensity.current) { (size * 2).roundToPx() }
    val shape = RoundedCornerShape(corner)

    Box(
        modifier = modifier
            .size(size)
            .clip(shape)
            .background(ObsidianColors.Surface2),
    ) {
        AsyncImage(
            model = ImageRequest.Builder(context)
                .data(data)
                .size(px, px)
                .crossfade(120)
                .build(),
            contentDescription = contentDescription,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(size),
        )
    }
}

/** The animated bars shown on the row that is currently playing. */
@Composable
fun BarsIndicator(
    playing: Boolean,
    modifier: Modifier = Modifier,
    barWidth: Dp = 2.5.dp,
    height: Dp = 12.dp,
) {
    val accent = accentColor
    val transition = rememberInfiniteTransition(label = "bars")
    val a by transition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(520, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "a",
    )
    val b by transition.animateFloat(
        initialValue = 1f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(430, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "b",
    )
    val c by transition.animateFloat(
        initialValue = 0.45f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(610, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "c",
    )

    Row(
        modifier = modifier.height(height).clearAndSetSemantics {},
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        listOf(if (playing) a else 0.3f, if (playing) b else 0.55f, if (playing) c else 0.4f)
            .forEach { scale ->
                Box(
                    Modifier
                        .width(barWidth)
                        .height(height * scale)
                        .clip(RoundedCornerShape(1.dp))
                        .background(accent),
                )
            }
    }
}

/** 1dp hairline; the only separator Obsidian uses. */
@Composable
fun Hairline(modifier: Modifier = Modifier) {
    Box(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(ObsidianColors.Hairline),
    )
}

/** Small wide-tracked label that sits above sections. */
@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = ObsidianColors.TextTertiary,
        modifier = modifier,
    )
}
