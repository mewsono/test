package dev.pixiv.data

/** Static demo content — swap for a repository/API later. */

data class Artist(
    val handle: String,
    val initial: String,
    val followers: String,
    val works: Int,
    val palette: AvatarPalette,
)

enum class AvatarPalette { Pink, Mint, Peach }

data class Artwork(
    val id: String,
    val title: String,
    val kanji: String,
    val category: String,
    val date: String,
    val likes: String,
    val views: String,
    val saves: String,
    val tags: List<String>,
    val description: String,
    val artist: Artist,
)

data class TrendingTag(val rank: Int, val tag: String, val works: String)

data class RisingArtist(val handle: String, val initial: String, val palette: AvatarPalette)

object DemoData {

    val mochiRin = Artist(
        handle = "mochi_rin",
        initial = "M",
        followers = "18.2k",
        works = 214,
        palette = AvatarPalette.Pink,
    )

    val featured = Artwork(
        id = "lanterns-water-gate",
        title = "Lanterns at the Water Gate",
        kanji = "夜祭",
        category = "Illustration",
        date = "Oct 28, 2026",
        likes = "12.4k",
        views = "86.9k",
        saves = "5.1k",
        tags = listOf("original", "lantern", "night sky", "festival"),
        description = "A quiet night at the river lanterns. Thank you for all the kind words on the sketch.",
        artist = mochiRin,
    )

    val rising = listOf(
        Triple("01", "Pagoda in Morning Mist", "lanterns-water-gate"),
        Triple("02", "Koi, Third Pond", "lanterns-water-gate"),
        Triple("03", "First Snow, Quiet Shrine", "lanterns-water-gate"),
    )

    val filters = listOf("All", "Illustration", "Manga", "Novels")

    val trendingTags = listOf(
        TrendingTag(1, "#autumn", "12.8k works"),
        TrendingTag(2, "#night sky", "9.4k works"),
        TrendingTag(3, "#halloween", "7.1k works"),
        TrendingTag(4, "#koi pond", "3.6k works"),
    )

    val risingArtists = listOf(
        RisingArtist("Kuroe Aya", "K", AvatarPalette.Pink),
        RisingArtist("haru.ink", "H", AvatarPalette.Mint),
        RisingArtist("sorano", "S", AvatarPalette.Peach),
    )

    const val ISSUE_LABEL = "Sat 31 Oct · Autumn issue"
    const val DAY_LABEL = "Illustration of the day"
    const val CONTEST_BADGE = "Contest · 3 days left"
    const val CONTEST_TITLE = "Harvest Moon Challenge"
    const val CONTEST_META = "2,480 entries so far"
}
