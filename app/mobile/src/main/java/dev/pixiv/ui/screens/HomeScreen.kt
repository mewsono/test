package dev.pixiv.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import dev.pixiv.ui.components.Avatar
import dev.pixiv.ui.components.CircleIconButton
import dev.pixiv.ui.components.DisplayText
import dev.pixiv.ui.components.Eyebrow
import dev.pixiv.ui.components.FilterChip
import dev.pixiv.ui.components.KoiThumbScene
import dev.pixiv.ui.components.LanternGateScene
import dev.pixiv.ui.components.PagodaThumbScene
import dev.pixiv.ui.components.SnowThumbScene
import dev.pixiv.ui.components.Wordmark
import dev.pixiv.ui.theme.PixivColors
import dev.pixiv.ui.theme.PixivDimens
import dev.pixiv.ui.theme.PixivType

/**
 * Home — a curated, editorial gallery feed.
 * Header (wordmark + actions) sits on the app background; the feed scrolls beneath it.
 */
@Composable
fun HomeScreen(onOpenArtwork: () -> Unit) {
    var selectedFilter by remember { mutableIntStateOf(0) }
    var liked by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        // header
        Row(
            Modifier
                .fillMaxWidth()
                .padding(start = 20.dp, end = 20.dp, top = 22.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Wordmark()
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CircleIconButton(R.drawable.ic_search, "Search")
                CircleIconButton(R.drawable.ic_bell, "Notifications", showBadge = true)
            }
        }

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 20.dp, end = 20.dp, bottom = 110.dp),
        ) {
            Spacer(Modifier.height(14.dp))
            Eyebrow(DemoData.ISSUE_LABEL, color = PixivColors.Muted)
            DisplayText(
                "Tonight's gallery",
                PixivType.SectionTitle,
                lineHeight = (PixivType.SectionTitle.value * 1.2f).sp,
            )

            Spacer(Modifier.height(14.dp))
            FeatureCard(liked = liked, onLike = { liked = !liked }, onOpen = onOpenArtwork)

            Spacer(Modifier.height(16.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                itemsIndexed(DemoData.filters) { index, label ->
                    FilterChip(label, index == selectedFilter) { selectedFilter = index }
                }
            }

            Spacer(Modifier.height(24.dp))
            SectionHeader("Rising tonight", "See all")
            Spacer(Modifier.height(12.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(DemoData.rising) { (rank, title, _) ->
                    RisingThumb(rank, title, onOpenArtwork)
                }
            }
        }
    }
}

@Composable
private fun FeatureCard(liked: Boolean, onLike: () -> Unit, onOpen: () -> Unit) {
    val art = DemoData.featured
    Box(
        Modifier
            .fillMaxWidth()
            .height(PixivDimens.HeroHeight)
            .clip(RoundedCornerShape(PixivDimens.HeroRadius))
            .border(1.dp, PixivColors.Hairline, RoundedCornerShape(PixivDimens.HeroRadius))
            .clickable(onClick = onOpen),
    ) {
        LanternGateScene(Modifier.fillMaxSize())

        // bottom scrim
        Box(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(150.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0x000B0A12), Color(0xEB0B0A12)),
                    ),
                ),
        )

        // "illustration of the day" pill
        Box(
            Modifier
                .align(Alignment.TopStart)
                .padding(start = 16.dp, top = 16.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0x8C0B0A12))
                .border(1.dp, PixivColors.Hairline, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 7.dp),
        ) {
            Text(
                DemoData.DAY_LABEL.uppercase(),
                color = PixivColors.Cream,
                style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp),
            )
        }

        DisplayText(
            art.kanji,
            22.sp,
            weight = FontWeight.Bold,
            letterSpacing = 6.sp,
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 18.dp, end = 20.dp),
        )

        // title, byline, like
        Row(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(start = 20.dp, end = 18.dp, bottom = 18.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(Modifier.weight(1f)) {
                DisplayText(art.title, PixivType.HeroTitle, lineHeight = (PixivType.HeroTitle.value * 1.12f).sp)
                Spacer(Modifier.height(9.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Avatar(art.artist.initial, art.artist.palette, size = 24.dp)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        art.artist.handle,
                        color = PixivColors.Cream,
                        style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Medium),
                    )
                    Text(
                        "  · ${art.likes} likes",
                        color = PixivColors.Muted,
                        style = TextStyle(fontSize = 13.sp),
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            LikeButton(liked, onLike)
        }
    }
}

@Composable
fun LikeButton(liked: Boolean, onLike: () -> Unit, size: androidx.compose.ui.unit.Dp = 48.dp) {
    Box(
        Modifier
            .size(size)
            .clip(CircleShape)
            .background(if (liked) PixivColors.LikedRed else PixivColors.Cream)
            .clickable(onClick = onLike),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painterResource(R.drawable.ic_heart),
            contentDescription = if (liked) "Unlike" else "Like",
            tint = if (liked) Color.White else PixivColors.LikeRed,
            modifier = Modifier.size(22.dp),
        )
    }
}

@Composable
private fun RisingThumb(rank: String, title: String, onOpen: () -> Unit) {
    Box(
        Modifier
            .width(PixivDimens.ThumbWidth)
            .height(PixivDimens.ThumbHeight)
            .clip(RoundedCornerShape(topStart = 62.dp, topEnd = 62.dp, bottomStart = 22.dp, bottomEnd = 22.dp))
            .border(
                1.dp,
                PixivColors.Hairline,
                RoundedCornerShape(topStart = 62.dp, topEnd = 62.dp, bottomStart = 22.dp, bottomEnd = 22.dp),
            )
            .clickable(onClick = onOpen),
    ) {
        Box(Modifier.fillMaxSize()) {
            when (rank) {
                "01" -> PagodaThumbScene(Modifier.fillMaxSize())
                "02" -> KoiThumbScene(Modifier.fillMaxSize())
                else -> SnowThumbScene(Modifier.fillMaxSize())
            }
        }
        Box(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(90.dp)
                .background(Brush.verticalGradient(listOf(Color(0x000B0A12), Color(0xE60B0A12)))),
        )
        Column(
            Modifier
                .align(Alignment.BottomStart)
                .padding(start = 14.dp, end = 12.dp, bottom = 12.dp),
        ) {
            Text(
                rank,
                color = PixivColors.Accent,
                style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp),
            )
            DisplayText(title, 15.sp, lineHeight = 18.sp)
        }
    }
}

@Composable
fun SectionHeader(title: String, link: String?) {
    Row(
        Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        DisplayText(title, PixivType.CardTitle)
        if (link != null) {
            Text(
                link,
                color = PixivColors.Accent,
                style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold),
            )
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 390, heightDp = 844)
@Composable
private fun HomePreview() = HomeScreen(onOpenArtwork = {})
