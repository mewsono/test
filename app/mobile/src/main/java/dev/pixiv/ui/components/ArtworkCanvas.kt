package dev.pixiv.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.tooling.preview.Preview

/**
 * The app's artwork is illustrative, not photographic: it is drawn with Compose
 * primitives so it stays crisp at any size and needs no image assets.
 *
 * Every scene is authored on a 390 x N design canvas and scaled to the box.
 */

private const val DESIGN_W = 390f

@Composable
fun LanternGateScene(modifier: Modifier = Modifier) {
    Box(modifier) {
        Canvas(Modifier.fillMaxSize()) { drawLanternGate(size) }
    }
}

@Composable
fun ArtworkHeroScene(modifier: Modifier = Modifier) {
    Box(modifier) {
        Canvas(Modifier.fillMaxSize()) { drawLanternGate(size, tall = true) }
    }
}

/**
 * Sunset, moon, mountain ridges, torii gate and river lanterns.
 *
 * The scene is authored on a 390 x 500 canvas. Short cards (the home hero is
 * 390 x 300) **crop** to the interesting band instead of squashing the art.
 */
private fun DrawScope.drawLanternGate(size: Size, tall: Boolean = false) {
    val k = size.width / DESIGN_W
    // A short card (home hero, 390x300) crops to design rows 150..450;
    // the tall detail hero shows the full 0..500 composition.
    val shift = if (tall) 0f else -150f * k
    fun x(v: Float) = v * k
    fun y(v: Float) = v * k + shift

    // sky
    drawRect(
        brush = Brush.verticalGradient(
            0f to Color(0xFF150F3D),
            0.42f to Color(0xFF52267F),
            0.72f to Color(0xFFE4557A),
            1f to Color(0xFFFFB885),
            startY = y(0f),
            endY = y(500f),
        ),
        topLeft = Offset(0f, y(0f)),
        size = Size(size.width, 500f * k),
    )

    // stars
    listOf(
        40f to 70f, 96f to 40f, 150f to 84f, 188f to 48f,
        360f to 60f, 20f to 124f, 120f to 110f, 300f to 96f, 250f to 40f,
    ).forEach { (px, py) ->
        drawCircle(Color(0xFFFFF3D6), radius = 1.4f * k, center = Offset(x(px), y(py)))
    }

    // moon glow + disc
    drawCircle(
        brush = Brush.radialGradient(
            0f to Color(0xB3FFF3D6),
            1f to Color(0x00FFF3D6),
            center = Offset(x(248f), y(96f)),
            radius = 120f * k,
        ),
        radius = 120f * k,
        center = Offset(x(248f), y(96f)),
    )
    drawCircle(Color(0xFFFFF3D6), radius = 34f * k, center = Offset(x(248f), y(96f)))

    // far ridges
    drawPath(
        Path().apply {
            moveTo(0f, y(300f))
            lineTo(x(60f), y(240f)); lineTo(x(110f), y(280f)); lineTo(x(170f), y(220f))
            lineTo(x(240f), y(285f)); lineTo(x(300f), y(235f)); lineTo(x(400f), y(300f))
            lineTo(x(400f), y(420f)); lineTo(0f, y(420f)); close()
        },
        color = Color(0xA66B3A92),
    )
    drawPath(
        Path().apply {
            moveTo(0f, y(330f))
            lineTo(x(80f), y(280f)); lineTo(x(140f), y(320f)); lineTo(x(220f), y(270f))
            lineTo(x(310f), y(325f)); lineTo(x(400f), y(285f))
            lineTo(x(400f), y(440f)); lineTo(0f, y(440f)); close()
        },
        color = Color(0xFF3A2270),
    )

    // mist band
    drawRect(
        brush = Brush.verticalGradient(
            0f to Color(0x00FFB885),
            1f to Color(0x8CFFB885),
            startY = y(300f),
            endY = y(370f),
        ),
        topLeft = Offset(0f, y(300f)),
        size = Size(size.width, 70f * k),
    )

    // water
    drawRect(
        brush = Brush.verticalGradient(
            0f to Color(0xFF4A2A7C),
            1f to Color(0xFF0C0828),
            startY = y(350f),
            endY = y(560f),
        ),
        topLeft = Offset(0f, y(350f)),
        size = Size(size.width, 220f * k),
    )

    // moon reflection
    listOf(
        Triple(226f, 362f, 44f), Triple(234f, 374f, 30f),
        Triple(222f, 388f, 52f), Triple(236f, 404f, 26f),
    ).forEachIndexed { i, (cx, cy, w) ->
        drawRoundRect(
            color = Color(0xFFFFF3D6).copy(alpha = 0.5f - i * 0.1f),
            topLeft = Offset(x(cx), y(cy)),
            size = Size(w * k, 3f * k),
            cornerRadius = CornerRadius(1.5f * k),
        )
    }

    // torii gate, plus its reflection below the waterline
    drawTorii(k, ::x, ::y)
    withTransform({ scale(1f, -1f, pivot = Offset(0f, y(350f))) }) {
        drawTorii(k, ::x, ::y, alpha = 0.28f)
    }

    // hanging lanterns
    drawPath(
        Path().apply {
            moveTo(0f, y(150f))
            cubicTo(x(100f), y(190f), x(200f), y(110f), x(400f), y(160f))
        },
        color = Color(0x991B1236),
        style = Stroke(width = 1.6f * k),
    )
    listOf(
        50f to 174f, 100f to 179f, 150f to 174f, 250f to 145f, 300f to 142f,
    ).forEach { (cx, cy) ->
        drawCircle(
            brush = Brush.radialGradient(
                0f to Color(0xF2FFC46B),
                1f to Color(0x00FFC46B),
                center = Offset(x(cx), y(cy)),
                radius = 22f * k,
            ),
            radius = 22f * k,
            center = Offset(x(cx), y(cy)),
        )
        drawOval(
            color = Color(0xFFFFC46B),
            topLeft = Offset(x(cx - 6f), y(cy - 8f)),
            size = Size(12f * k, 16f * k),
        )
    }

    // foreground banks
    drawPath(
        Path().apply {
            moveTo(0f, y(420f)); quadraticTo(x(70f), y(392f), x(150f), y(432f))
            lineTo(x(150f), y(560f)); lineTo(0f, y(560f)); close()
        },
        color = Color(0xFF0B0720),
    )
    drawPath(
        Path().apply {
            moveTo(x(310f), y(470f)); quadraticTo(x(360f), y(430f), x(400f), y(440f))
            lineTo(x(400f), y(560f)); lineTo(x(310f), y(560f)); close()
        },
        color = Color(0xFF0B0720),
    )

    // petals
    listOf(
        60f to 300f, 330f to 260f, 190f to 330f, 270f to 210f,
        110f to 240f, 360f to 360f, 30f to 380f,
    ).forEach { (px, py) ->
        drawCircle(Color(0xD9FFC2D4), radius = 3.4f * k, center = Offset(x(px), y(py)))
    }
}

private fun DrawScope.drawTorii(scale: Float, x: (Float) -> Float, y: (Float) -> Float, alpha: Float = 1f) {
    val red = Color(0xFFE8452E).copy(alpha = alpha)
    drawRect(red, topLeft = Offset(x(150f), y(196f)), size = Size(14f * scale, 154f * scale))
    drawRect(red, topLeft = Offset(x(236f), y(196f)), size = Size(14f * scale, 154f * scale))
    drawRect(red, topLeft = Offset(x(136f), y(240f)), size = Size(128f * scale, 9f * scale))
    drawPath(
        Path().apply {
            moveTo(x(112f), y(196f)); quadraticTo(x(200f), y(220f), x(288f), y(196f))
            lineTo(x(288f), y(206f)); quadraticTo(x(200f), y(230f), x(112f), y(206f)); close()
        },
        color = red,
    )
    drawPath(
        Path().apply {
            moveTo(x(100f), y(184f)); quadraticTo(x(200f), y(214f), x(300f), y(184f))
            lineTo(x(304f), y(174f)); quadraticTo(x(200f), y(204f), x(96f), y(174f)); close()
        },
        color = Color(0xFF1B1236).copy(alpha = alpha),
    )
}

/** Coral / teal pagoda vignette used in the "Rising tonight" rail. */
@Composable
fun PagodaThumbScene(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val s = size.width / 140f
        drawRect(
            Brush.verticalGradient(
                0f to Color(0xFF1D8A8F),
                0.55f to Color(0xFF0C4468),
                1f to Color(0xFF071B3C),
            ),
        )
        drawCircle(
            Brush.radialGradient(
                0f to Color(0x80BFF7E8), 1f to Color(0x00BFF7E8),
                center = Offset(40f * s, 40f * s), radius = 70f * s,
            ),
            radius = 70f * s, center = Offset(40f * s, 40f * s),
        )
        repeat(3) { ring ->
            drawCircle(
                color = Color(0xFFBFF7E8).copy(alpha = 0.4f - ring * 0.14f),
                radius = (14 + ring * 12) * s,
                center = Offset(96f * s, 64f * s),
                style = Stroke(width = 1f * s),
            )
        }
        // hills
        drawOval(Color(0xFF35A887), Offset(6f * s, 140f * s), Size(48f * s, 28f * s))
        drawOval(Color(0xFF2B8F77), Offset(82f * s, 162f * s), Size(56f * s, 32f * s))
        drawOval(Color(0xFF3FB893), Offset(46f * s, 190f * s), Size(40f * s, 20f * s))
        // pagoda
        repeat(3) { tier ->
            val ty = 96f + tier * 26f
            val halfW = 34f - tier * 7f
            drawRect(
                Color(0xFFD2452F),
                Offset((70f - halfW / 2f) * s, ty * s),
                Size(halfW * s, 22f * s),
            )
            drawPath(
                Path().apply {
                    moveTo((70f - halfW) * s, ty * s)
                    lineTo((70f + halfW) * s, ty * s)
                    lineTo((70f + halfW * 0.55f) * s, (ty - 10f) * s)
                    lineTo((70f - halfW * 0.55f) * s, (ty - 10f) * s)
                    close()
                },
                color = Color(0xFF1E2350),
            )
        }
        drawCircle(Color(0xFFFFC46B), radius = 5f * s, center = Offset(70f * s, 132f * s))
    }
}

/** Koi pond vignette. */
@Composable
fun KoiThumbScene(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val s = size.width / 140f
        drawRect(
            Brush.verticalGradient(
                0f to Color(0xFF123A54),
                1f to Color(0xFF071B3C),
            ),
        )
        repeat(4) { i ->
            drawCircle(
                color = Color(0xFFBFF7E8).copy(alpha = 0.10f - i * 0.02f),
                radius = (30f + i * 18f) * s,
                center = Offset(70f * s, 120f * s),
                style = Stroke(width = 1f * s),
            )
        }
        // lily pads
        drawOval(Color(0xFF2B8F77), Offset(12f * s, 150f * s), Size(56f * s, 30f * s))
        drawOval(Color(0xFF3FB893), Offset(86f * s, 168f * s), Size(44f * s, 24f * s))
        // koi
        fun koi(cx: Float, cy: Float, angle: Float, body: Color, fin: Color) {
            withTransform({ rotate(angle, Offset(cx * s, cy * s)) }) {
                drawOval(body, Offset((cx - 20f) * s, (cy - 7f) * s), Size(40f * s, 14f * s))
                drawPath(
                    Path().apply {
                        moveTo((cx - 18f) * s, cy * s)
                        quadraticTo((cx - 30f) * s, (cy - 9f) * s, (cx - 36f) * s, (cy - 5f) * s)
                        quadraticTo((cx - 31f) * s, cy * s, (cx - 36f) * s, (cy + 6f) * s)
                        quadraticTo((cx - 30f) * s, (cy + 9f) * s, (cx - 18f) * s, cy * s)
                        close()
                    },
                    color = fin,
                )
                drawCircle(Color(0xFF1A1048), radius = 1.4f * s, center = Offset((cx + 14f) * s, (cy - 2f) * s))
            }
        }
        koi(70f, 104f, -24f, Color(0xFFFF7438), Color(0xFFFF9A63))
        koi(96f, 138f, 152f, Color(0xFFF4F0E8), Color(0xFFE9E2D6))
    }
}

/** Snowfall shrine vignette. */
@Composable
fun SnowThumbScene(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val s = size.width / 140f
        drawRect(
            Brush.verticalGradient(
                0f to Color(0xFF16205E),
                0.5f to Color(0xFF5568C4),
                0.78f to Color(0xFFF3C7D6),
            ),
        )
        drawCircle(Color(0xFFFFF3DA), radius = 10f * s, center = Offset(104f * s, 46f * s))
        // pines
        listOf(14f to 106f, 38f to 96f, 116f to 88f).forEach { (px, py) ->
            drawPath(
                Path().apply {
                    moveTo((px - 14f) * s, 152f * s)
                    lineTo(px * s, py * s)
                    lineTo((px + 14f) * s, 152f * s)
                    close()
                },
                color = Color(0xFF1E2350),
            )
        }
        // snow ground
        drawPath(
            Path().apply {
                moveTo(0f, 152f * s)
                quadraticTo(70f * s, 138f * s, 140f * s, 152f * s)
                lineTo(140f * s, 220f * s); lineTo(0f, 220f * s); close()
            },
            brush = Brush.verticalGradient(
                0f to Color(0xFFF4F6FF), 1f to Color(0xFFB7C3EC),
                startY = 140f * s, endY = 220f * s,
            ),
        )
        // shrine
        drawRect(Color(0xFF8794C9), Offset(38f * s, 150f * s), Size(60f * s, 6f * s))
        drawRect(Color(0xE6FFC46B), Offset(56f * s, 128f * s), Size(24f * s, 22f * s))
        drawRect(Color(0xFFD2452F), Offset(46f * s, 118f * s), Size(5f * s, 34f * s))
        drawRect(Color(0xFFD2452F), Offset(85f * s, 118f * s), Size(5f * s, 34f * s))
        drawRect(Color(0xFFD2452F), Offset(42f * s, 112f * s), Size(52f * s, 7f * s))
        drawPath(
            Path().apply {
                moveTo(30f * s, 112f * s)
                quadraticTo(60f * s, 108f * s, 68f * s, 92f * s)
                quadraticTo(76f * s, 108f * s, 106f * s, 112f * s)
                close()
            },
            color = Color(0xFF1E2350),
        )
        // stone lantern
        drawCircle(Color(0xFFFFC46B), radius = 6f * s, center = Offset(113f * s, 140f * s))
        // snowflakes
        listOf(
            20f to 30f, 52f to 58f, 88f to 24f, 120f to 80f, 30f to 96f,
            74f to 84f, 108f to 116f, 14f to 130f, 64f to 170f, 92f to 190f,
        ).forEach { (px, py) ->
            drawCircle(Color(0xD9FFFFFF), radius = 1.3f * s, center = Offset(px * s, py * s))
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 390, heightDp = 300)
@Composable
private fun LanternGatePreview() {
    Box(Modifier.fillMaxSize()) {
        LanternGateScene(Modifier.fillMaxSize())
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 124, heightDp = 200)
@Composable
private fun PagodaPreview() {
    PagodaThumbScene(Modifier.fillMaxSize())
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 124, heightDp = 200)
@Composable
private fun KoiPreview() {
    KoiThumbScene(Modifier.fillMaxSize())
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 124, heightDp = 200)
@Composable
private fun SnowPreview() {
    SnowThumbScene(Modifier.fillMaxSize())
}
