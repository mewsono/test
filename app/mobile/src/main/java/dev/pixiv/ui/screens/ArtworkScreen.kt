package dev.pixiv.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.pixiv.R
import dev.pixiv.data.DemoData
import dev.pixiv.ui.components.ArtworkHeroScene
import dev.pixiv.ui.components.CircleIconButton
import dev.pixiv.ui.components.CreamActionButton
import dev.pixiv.ui.components.DisplayText
import dev.pixiv.ui.components.dmSans
import dev.pixiv.ui.components.FollowButton
import dev.pixiv.ui.components.Hairline
import dev.pixiv.ui.components.RingedAvatar
import dev.pixiv.ui.theme.PixivColors
import dev.pixiv.ui.theme.PixivType

/**
 * Artwork detail — full-bleed hero, title card, artist row, stats, tags and a
 * floating glass action bar. Content scrolls under the hero.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ArtworkScreen(onBack: () -> Unit) {
    val art = DemoData.featured
    var liked by remember { mutableStateOf(false) }
    var following by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        Box {
            // hero
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(480.dp),
            ) {
                ArtworkHeroScene(Modifier.fillMaxSize())
                Box(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .height(230.dp)
                        .background(Brush.verticalGradient(listOf(Color(0x000B0A12), Color(0xFF0B0A12)))),
                )
                CircleIconButton(
                    R.drawable.ic_back,
                    "Back",
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(start = 16.dp, top = 20.dp)
                        .background(Color(0x800B0A12), CircleShape),
                    onClick = onBack,
                )
                CircleIconButton(
                    R.drawable.ic_more,
                    "More",
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(end = 16.dp, top = 20.dp)
                        .background(Color(0x800B0A12), CircleShape),
                )
                DisplayText(
                    art.kanji,
                    22.sp,
                    weight = FontWeight.Bold,
                    letterSpacing = 6.sp,
                    modifier = Modifier.align(Alignment.TopEnd).padding(top = 84.dp, end = 24.dp),
                )
            }
        }

        // headline block
        Column(Modifier.padding(start = 22.dp, end = 22.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    art.category.uppercase(),
                    color = PixivColors.Accent,
                    style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.8.sp),
                )
                Spacer(Modifier.width(10.dp))
                Box(Modifier.width(24.dp).height(1.dp).background(Color(0x66F3EBDD)))
                Spacer(Modifier.width(10.dp))
                Text(
                    art.date,
                    color = PixivColors.Muted,
                    style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.4.sp),
                )
            }
            Spacer(Modifier.height(6.dp))
            DisplayText(art.title, PixivType.Display, weight = FontWeight.ExtraBold, lineHeight = (PixivType.Display.value * 1.1f).sp)
            Spacer(Modifier.height(14.dp))
        }

        // scrollable detail
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 22.dp, end = 22.dp, bottom = 110.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RingedAvatar(art.artist.initial, art.artist.palette)
                Spacer(Modifier.width(12.dp))
                Column {
                    DisplayText(art.artist.handle, 15.sp)
                    Text(
                        "${art.artist.followers} followers · ${art.artist.works} works",
                        color = PixivColors.Muted,
                        style = TextStyle(fontSize = 12.sp),
                    )
                }
                Spacer(Modifier.weight(1f))
                FollowButton(following) { following = !following }
            }

            StatRow(art)

            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                art.tags.forEach { tag ->
                    Row(
                        Modifier
                            .clip(RoundedCornerShape(18.dp))
                            .border(1.dp, PixivColors.Hairline, RoundedCornerShape(18.dp))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                    ) {
                        Text("#", color = PixivColors.Accent, style = TextStyle(fontFamily = dmSans(), fontSize = 13.sp, fontWeight = FontWeight.Medium))
                        Text(tag, color = PixivColors.Lavender, style = TextStyle(fontFamily = dmSans(), fontSize = 13.sp, fontWeight = FontWeight.Medium))
                    }
                }
            }

            Text(
                art.description,
                color = PixivColors.Body,
                style = TextStyle(fontFamily = dmSans(), fontSize = PixivType.Body, lineHeight = 22.sp),
            )
        }
    }
}

@Composable
private fun StatRow(art: dev.pixiv.data.Artwork) {
    Column {
        Hairline()
        Row(Modifier.fillMaxWidth()) {
            Stat("Likes", art.likes, Modifier.weight(1f), divider = false)
            Stat("Views", art.views, Modifier.weight(1f), divider = true)
            Stat("Saved", art.saves, Modifier.weight(1f), divider = true)
        }
        Hairline()
    }
}

@Composable
private fun Stat(label: String, value: String, modifier: Modifier = Modifier, divider: Boolean) {
    Row(modifier) {
        if (divider) {
            Box(Modifier.width(1.dp).height(42.dp).background(PixivColors.Hairline))
        }
        Column(Modifier.padding(start = if (divider) 16.dp else 0.dp, top = 10.dp, bottom = 10.dp)) {
            DisplayText(value, PixivType.Stat)
            Text(
                label.uppercase(),
                color = PixivColors.Muted,
                style = TextStyle(fontSize = 11.sp, letterSpacing = 1.5.sp),
            )
        }
    }
}

/** Floating glass action bar (Like / Save / Comment / Share). */
@Composable
fun ArtworkActionBar(liked: Boolean, onLike: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .height(62.dp)
            .clip(RoundedCornerShape(31.dp))
            .background(PixivColors.NavSurface)
            .border(1.dp, PixivColors.Hairline, RoundedCornerShape(31.dp))
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        CreamActionButton(
            label = if (liked) "Liked" else "Like",
            iconRes = R.drawable.ic_heart,
            active = liked,
            onClick = onLike,
            modifier = Modifier.weight(1f),
        )
        RoundAction(R.drawable.ic_bookmark, "Save")
        RoundAction(R.drawable.ic_comment, "Comments")
        RoundAction(R.drawable.ic_trending, "Share")
    }
}

@Composable
private fun RoundAction(icon: Int, label: String) {
    Box(
        Modifier
            .size(48.dp)
            .clip(CircleShape)
            .clickable { },
        contentAlignment = Alignment.Center,
    ) {
        Icon(painterResource(icon), contentDescription = label, tint = PixivColors.Cream, modifier = Modifier.size(21.dp))
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 390, heightDp = 844)
@Composable
private fun ArtworkPreview() = ArtworkScreen(onBack = {})
