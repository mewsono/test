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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.pixiv.R
import dev.pixiv.data.DemoData
import dev.pixiv.ui.components.DisplayText
import dev.pixiv.ui.components.DottedTitle
import dev.pixiv.ui.components.Eyebrow
import dev.pixiv.ui.components.Hairline
import dev.pixiv.ui.components.RingedAvatar
import dev.pixiv.ui.components.SectionHeader
import dev.pixiv.ui.theme.PixivColors
import dev.pixiv.ui.theme.PixivType

/**
 * Discover — search entry, trending tags and rising artists.
 */
@Composable
fun DiscoverScreen() {
    var query by remember { mutableStateOf("") }
    val following = remember { mutableStateMapOf<String, Boolean>() }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 22.dp, end = 22.dp, bottom = 110.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        Eyebrow("Find your next favorite")
        DottedTitle("Discover")

        Spacer(Modifier.height(18.dp))
        SearchField(query) { query = it }

        Spacer(Modifier.height(24.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            DisplayText("Trending tags", PixivType.CardTitle)
            Text("Past 24 hours", color = PixivColors.Muted, style = TextStyle(fontSize = 12.sp))
        }

        Spacer(Modifier.height(4.dp))
        DemoData.trendingTags.forEach { tag ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clickable { },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "%02d".format(tag.rank),
                    color = PixivColors.Accent,
                    modifier = Modifier.width(22.dp),
                    style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp),
                )
                Spacer(Modifier.width(16.dp))
                DisplayText(tag.tag, 21.sp, modifier = Modifier.weight(1f))
                Text(tag.works, color = PixivColors.Muted, style = TextStyle(fontSize = 12.sp))
            }
            Hairline()
        }

        Spacer(Modifier.height(24.dp))
        SectionHeader("Rising artists", "See all")

        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DemoData.risingArtists.forEach { artist ->
                val isFollowing = following[artist.handle] == true
                Column(
                    Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    RingedAvatar(
                        artist.initial,
                        artist.palette,
                        size = 64.dp,
                        dimmed = isFollowing,
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        artist.handle,
                        color = PixivColors.Cream,
                        style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold),
                        maxLines = 1,
                    )
                    Box(
                        Modifier
                            .height(44.dp)
                            .clip(RoundedCornerShape(22.dp))
                            .clickable { following[artist.handle] = !isFollowing }
                            .padding(horizontal = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            if (isFollowing) "Following" else "Follow",
                            color = if (isFollowing) PixivColors.Muted else PixivColors.Accent,
                            style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold),
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        ContestCard()
    }
}

@Composable
private fun SearchField(query: String, onQuery: (String) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .height(52.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            painterResource(R.drawable.ic_search),
            contentDescription = null,
            tint = PixivColors.Muted,
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.width(12.dp))
        Box(Modifier.weight(1f)) {
            if (query.isEmpty()) {
                Text(
                    "Search tags, artists, works",
                    color = PixivColors.Muted,
                    style = TextStyle(fontSize = 16.sp),
                )
            }
            BasicTextField(
                value = query,
                onValueChange = onQuery,
                textStyle = TextStyle(fontSize = 16.sp, color = PixivColors.Cream),
                cursorBrush = SolidColor(PixivColors.Accent),
                singleLine = true,
            )
        }
    }
    Hairline(color = Color(0x4DF3EBDD))
}

/** Coral/violet contest banner with the midnight-moon scene. */
@Composable
private fun ContestCard() {
    Box(
        Modifier
            .fillMaxWidth()
            .height(134.dp)
            .clip(RoundedCornerShape(28.dp))
            .border(1.dp, PixivColors.Hairline, RoundedCornerShape(28.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFF2A1B4E), Color(0xFF6B2E4C), Color(0xFFFF9A63)),
                ),
            )
            .clickable { },
    ) {
        // moon
        Box(
            Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 28.dp)
                .size(74.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFF3D6).copy(alpha = 0.9f)),
        )
        Box(
            Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 44.dp)
                .size(74.dp)
                .clip(CircleShape)
                .background(Color(0xFF3A2350)),
        )
        // scrim
        Box(Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Color(0xD10B0A12), Color(0x260B0A12)))))

        Column(
            Modifier
                .fillMaxSize()
                .padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0x8C0B0A12))
                    .border(1.dp, PixivColors.Hairline, RoundedCornerShape(14.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    DemoData.CONTEST_BADGE.uppercase(),
                    color = PixivColors.Cream,
                    style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp),
                )
            }
            Column {
                DisplayText(
                    DemoData.CONTEST_TITLE,
                    24.sp,
                    weight = FontWeight.ExtraBold,
                    lineHeight = 27.sp,
                )
                Text(DemoData.CONTEST_META, color = PixivColors.Lavender, style = TextStyle(fontSize = 12.sp))
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0A12, widthDp = 390, heightDp = 844)
@Composable
private fun DiscoverPreview() = DiscoverScreen()
