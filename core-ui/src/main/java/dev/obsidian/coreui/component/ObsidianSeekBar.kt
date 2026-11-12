package dev.obsidian.coreui.component

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.obsidian.coreui.theme.ObsidianColors
import dev.obsidian.coreui.theme.ObsidianSizes
import dev.obsidian.coreui.theme.accentColor

/**
 * Playback position.
 *
 * `progress` is a lambda read inside the draw phase, so the position can tick
 * four times a second (or every frame) without ever recomposing this subtree —
 * it only invalidates the draw pass.
 */
@Composable
fun ObsidianSeekBar(
    progress: () -> Float,
    onSeek: (Float) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    trackColor: Color = ObsidianColors.TrackIdle,
    contentDescription: String = "Playback position",
) {
    var dragging by remember { mutableStateOf(false) }
    var dragFraction by remember { mutableFloatStateOf(0f) }
    val currentProgress by rememberUpdatedState(progress)
    val currentOnSeek by rememberUpdatedState(onSeek)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(ObsidianSizes.TouchTarget)
            .semantics {
                this.contentDescription = contentDescription
                progressBarRangeInfo = ProgressBarRangeInfo(
                    current = if (dragging) dragFraction else currentProgress(),
                    range = 0f..1f,
                )
            }
            .pointerInput(enabled) {
                if (!enabled) return@pointerInput
                detectTapGestures { offset ->
                    val fraction = (offset.x / size.width).coerceIn(0f, 1f)
                    currentOnSeek(fraction)
                }
            }
            .pointerInput(enabled) {
                if (!enabled) return@pointerInput
                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        dragging = true
                        dragFraction = (offset.x / size.width).coerceIn(0f, 1f)
                    },
                    onDragEnd = {
                        dragging = false
                        currentOnSeek(dragFraction)
                    },
                    onDragCancel = { dragging = false },
                ) { change, _ ->
                    dragFraction = (change.position.x / size.width).coerceIn(0f, 1f)
                    change.consume()
                }
            },
    ) {
        val accent = accentColor
        Canvas(Modifier.fillMaxWidth().height(ObsidianSizes.TouchTarget)) {
            val fraction = (if (dragging) dragFraction else currentProgress()).coerceIn(0f, 1f)
            val centerY = size.height / 2f
            val trackH = ObsidianSizes.SeekTrack.toPx()
            val radius = CornerRadius(trackH / 2f, trackH / 2f)

            drawRoundRect(
                color = trackColor,
                topLeft = Offset(0f, centerY - trackH / 2f),
                size = Size(size.width, trackH),
                cornerRadius = radius,
            )
            if (fraction > 0f) {
                drawRoundRect(
                    color = accent,
                    topLeft = Offset(0f, centerY - trackH / 2f),
                    size = Size(size.width * fraction, trackH),
                    cornerRadius = radius,
                )
            }

            // 14dp white thumb, allowed to overhang the track but kept inside the touch target
            val thumbR = ObsidianSizes.SeekThumb.toPx() / 2f
            val cx = (size.width * fraction).coerceIn(thumbR, size.width - thumbR)
            drawCircle(color = Color.White, radius = thumbR, center = Offset(cx, centerY))
        }
    }
}
