package dev.pixiv.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.pixiv.R
import dev.pixiv.data.AvatarPalette
import dev.pixiv.ui.theme.PixivColors
import dev.pixiv.ui.theme.PixivDimens
import dev.pixiv.ui.theme.PixivType

/* ───────────────────────────── fonts ───────────────────────────── */

/**
 * Bricolage Grotesque (OFL) is bundled for display type, DM Sans for body copy.
 * Both are variable fonts shipped in res/font.
 */
@Composable
fun bricolage(weight: FontWeight = FontWeight.Bold): FontFamily {
    val res = if (weight.weight >= 800) R.font.bricolage_grotesque_extra_bold
    else R.font.bricolage_grotesque_bold
    return remember(res) { FontFamily(Font(res)) }
}

@Composable
fun dmSans(): FontFamily = remember { FontFamily(Font(R.font.dm_sans)) }

/* ───────────────────────────── type ───────────────────────────── */

/** Display face: Bricolage Grotesque when bundled, otherwise a tight grotesque. */
@Composable
fun DisplayText(
    text: String,
    size: androidx.compose.ui.unit.TextUnit,
    modifier: Modifier = Modifier,
    weight: FontWeight = FontWeight.Bold,
    color: Color = PixivColors.Cream,
    lineHeight: androidx.compose.ui.unit.TextUnit = (size.value * 1.15f).sp,
    letterSpacing: androidx.compose.ui.unit.TextUnit = 0.sp,
    textAlign: TextAlign? = null,
) = Text(
    text = text,
    modifier = modifier,
    color = color,
    textAlign = textAlign,
    style = TextStyle(
        fontFamily = bricolage(weight),
        fontWeight = weight,
        fontSize = size,
        lineHeight = lineHeight,
        letterSpacing = letterSpacing,
    ),
)

@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier, color: Color = PixivColors.Muted) = Text(
    text = text.uppercase(),
    modifier = modifier,
    color = color,
    style = TextStyle(
        fontFamily = dmSans(),
        fontSize = PixivType.Eyebrow,
        fontWeight = FontWeight.Medium,
        letterSpacing = 1.7.sp,
    ),
)

/** "pixiv" wordmark with the coral period. */
@Composable
fun Wordmark(modifier: Modifier = Modifier) {
    Row(modifier, verticalAlignment = Alignment.Bottom) {
        DisplayText("pixiv", PixivType.Wordmark, weight = FontWeight.ExtraBold)
        DisplayText(".", PixivType.Wordmark, weight = FontWeight.ExtraBold, color = PixivColors.Accent)
    }
}

/** Page title with an accent full stop, e.g. "Discover." */
@Composable
fun DottedTitle(text: String, modifier: Modifier = Modifier, size: androidx.compose.ui.unit.TextUnit = PixivType.PageTitle) {
    Row(modifier, verticalAlignment = Alignment.Bottom) {
        DisplayText(text, size, weight = FontWeight.ExtraBold, lineHeight = (size.value * 1.1f).sp)
        DisplayText(".", size, weight = FontWeight.ExtraBold, color = PixivColors.Accent, lineHeight = (size.value * 1.1f).sp)
    }
}

/* ───────────────────────────── buttons ───────────────────────────── */

/** Round 44dp outlined icon button used in headers and over artwork. */
@Composable
fun CircleIconButton(
    iconRes: Int,
    contentDescription: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {},
    tint: Color = PixivColors.Cream,
    showBadge: Boolean = false,
) {
    Box(
        modifier
            .size(PixivDimens.IconButton)
            .clip(CircleShape)
            .background(PixivColors.SurfaceTint)
            .border(1.dp, PixivColors.Border, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painter = painterResource(iconRes),
            contentDescription = contentDescription,
            tint = tint,
            modifier = Modifier.size(21.dp),
        )
        if (showBadge) {
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 10.dp, end = 11.dp)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(PixivColors.Accent),
            )
        }
    }
}

/** Filter chip — cream when selected. */
@Composable
fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val bg by animateColorAsState(if (selected) PixivColors.Cream else Color.Transparent, label = "chipBg")
    val fg by animateColorAsState(if (selected) PixivColors.Ink else PixivColors.Lavender, label = "chipFg")
    Box(
        Modifier
            .height(PixivDimens.ChipHeight)
            .clip(RoundedCornerShape(PixivDimens.ChipRadius))
            .background(bg)
            .border(1.dp, if (selected) PixivColors.Cream else PixivColors.Hairline, RoundedCornerShape(PixivDimens.ChipRadius))
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            label,
            color = fg,
            style = TextStyle(fontFamily = dmSans(), fontSize = 14.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium),
        )
    }
}

/** Cream pill button with a pressed-scale micro interaction (used for Like). */
@Composable
fun CreamActionButton(
    label: String,
    iconRes: Int,
    active: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (pressed) 0.96f else 1f, label = "press")
    val bg by animateColorAsState(if (active) PixivColors.LikedRed else PixivColors.Cream, label = "likeBg")
    val fg = if (active) Color.White else PixivColors.Ink
    Row(
        modifier
            .height(48.dp)
            .scale(scale)
            .clip(RoundedCornerShape(24.dp))
            .background(bg)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(painterResource(iconRes), contentDescription = null, tint = fg, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(label, color = fg, style = TextStyle(fontFamily = dmSans(), fontSize = 15.sp, fontWeight = FontWeight.Bold))
    }
}

/** Outlined Follow / Following button. */
@Composable
fun FollowButton(following: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val bg by animateColorAsState(if (following) PixivColors.Cream else Color.Transparent, label = "followBg")
    val fg by animateColorAsState(if (following) PixivColors.Ink else PixivColors.Cream, label = "followFg")
    Box(
        modifier
            .height(44.dp)
            .clip(RoundedCornerShape(22.dp))
            .background(bg)
            .border(1.dp, if (following) PixivColors.Cream else PixivColors.BorderStrong, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 22.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            if (following) "Following" else "Follow",
            color = fg,
            style = TextStyle(fontFamily = dmSans(), fontSize = 14.sp, fontWeight = FontWeight.Bold),
        )
    }
}

/* ───────────────────────────── bottom navigation ───────────────────────────── */

enum class Tab(val icon: Int, val label: String) {
    Home(R.drawable.ic_home, "Home"),
    Discover(R.drawable.ic_compass, "Discover"),
    Saved(R.drawable.ic_bookmark, "Saved"),
    Profile(R.drawable.ic_profile, "Profile"),
}

/**
 * Glass pill navigation from the design: the active tab turns cream with a
 * coral dot, the centre button is the "post" action.
 */
@Composable
fun PixivBottomBar(
    selected: Tab,
    onSelect: (Tab) -> Unit,
    onCompose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp)
            .height(PixivDimens.NavHeight)
            .clip(RoundedCornerShape(PixivDimens.NavRadius))
            .background(PixivColors.NavSurface)
            .border(1.dp, PixivColors.Hairline, RoundedCornerShape(PixivDimens.NavRadius))
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        NavItem(Tab.Home, selected == Tab.Home) { onSelect(Tab.Home) }
        NavItem(Tab.Discover, selected == Tab.Discover) { onSelect(Tab.Discover) }
        Box(
            Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(PixivColors.Cream)
                .clickable(onClick = onCompose),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painterResource(R.drawable.ic_plus),
                contentDescription = "New work",
                tint = PixivColors.Ink,
                modifier = Modifier.size(23.dp),
            )
        }
        NavItem(Tab.Saved, selected == Tab.Saved) { onSelect(Tab.Saved) }
        NavItem(Tab.Profile, selected == Tab.Profile) { onSelect(Tab.Profile) }
    }
}

@Composable
private fun RowScope.NavItem(tab: Tab, on: Boolean, onClick: () -> Unit) {
    val tint by animateColorAsState(if (on) PixivColors.Cream else PixivColors.Muted, label = "navTint")
    Box(
        Modifier
            .size(48.dp)
            .clip(CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(painterResource(tab.icon), contentDescription = tab.label, tint = tint, modifier = Modifier.size(23.dp))
        if (on) {
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 2.dp)
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(PixivColors.Accent),
            )
        }
    }
}

/* ───────────────────────────── avatars ───────────────────────────── */

fun AvatarPalette.brush(): Brush = when (this) {
    AvatarPalette.Pink -> Brush.linearGradient(listOf(Color(0xFFFFD6E0), Color(0xFFBFA8FF)))
    AvatarPalette.Mint -> Brush.linearGradient(listOf(Color(0xFFC9F2E4), Color(0xFFA8C8FF)))
    AvatarPalette.Peach -> Brush.linearGradient(listOf(Color(0xFFFFE9B8), Color(0xFFFFB89A)))
}

@Composable
fun Avatar(
    initial: String,
    palette: AvatarPalette,
    size: androidx.compose.ui.unit.Dp = 24.dp,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .size(size)
            .clip(CircleShape)
            .background(palette.brush()),
        contentAlignment = Alignment.Center,
    ) {
        DisplayText(
            initial,
            (size.value * 0.5f).sp,
            weight = FontWeight.ExtraBold,
            color = PixivColors.Ink,
        )
    }
}

/** Accent ring + ink gap + avatar, as used on the artist row. */
@Composable
fun RingedAvatar(
    initial: String,
    palette: AvatarPalette,
    size: androidx.compose.ui.unit.Dp = 46.dp,
    dimmed: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val ring = if (dimmed) Color(0x40F3EBDD) else null
    Box(
        modifier
            .size(size)
            .clip(CircleShape)
            .then(
                if (ring != null) Modifier.background(ring)
                else Modifier.background(Brush.linearGradient(listOf(PixivColors.Accent, PixivColors.Violet))),
            )
            .padding(2.dp)
            .clip(CircleShape)
            .background(PixivColors.Ink)
            .padding(2.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(palette.brush()),
            contentAlignment = Alignment.Center,
        ) {
            DisplayText(
                initial,
                (size.value * 0.36f).sp,
                weight = FontWeight.ExtraBold,
                color = PixivColors.Ink,
            )
        }
    }
}

/** 1px rule used across the design. */
@Composable
fun Hairline(modifier: Modifier = Modifier, color: Color = PixivColors.Hairline) {
    Box(modifier.fillMaxWidth().height(1.dp).background(color))
}
