package dev.pixiv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import dev.pixiv.ui.components.PixivBottomBar
import dev.pixiv.ui.components.Tab
import dev.pixiv.ui.screens.ArtworkActionBar
import dev.pixiv.ui.screens.ArtworkScreen
import dev.pixiv.ui.screens.DiscoverScreen
import dev.pixiv.ui.screens.HomeScreen
import dev.pixiv.ui.theme.PixivColors

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PixivApp()
        }
    }
}

/**
 * Single-activity app shell.
 *
 * Home / Discover are tabs; the artwork detail is pushed on top of the current
 * tab as a full-screen destination (its own action bar replaces the tab bar).
 */
@Composable
fun PixivApp() {
    // Store the ordinal so the state survives process death without a custom Saver.
    var tabOrdinal by rememberSaveable { mutableStateOf(Tab.Home.ordinal) }
    val tab = Tab.entries[tabOrdinal]
    var showArtwork by rememberSaveable { mutableStateOf(false) }
    var liked by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(PixivColors.Ink)) {
        // ambient coral / violet glows from the design
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0x38FF6B4A),
                            Color(0x000B0A12),
                            Color(0x000B0A12),
                            Color(0x428F6BFF),
                        ),
                    ),
                ),
        )

        Box(
            Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
                .windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            AnimatedContent(
                targetState = showArtwork,
                transitionSpec = {
                    if (targetState) {
                        (slideInHorizontally { it / 4 } + fadeIn()) togetherWith fadeOut()
                    } else {
                        fadeIn() togetherWith (slideOutHorizontally { it / 4 } + fadeOut())
                    }
                },
                label = "screen",
            ) { artwork ->
                if (artwork) {
                    Box(Modifier.fillMaxSize()) {
                        ArtworkScreen(onBack = { showArtwork = false })
                        ArtworkActionBar(
                            liked = liked,
                            onLike = { liked = !liked },
                            modifier = Modifier.align(Alignment.BottomCenter),
                        )
                    }
                } else {
                    Box(Modifier.fillMaxSize()) {
                        when (tab) {
                            Tab.Discover -> DiscoverScreen()
                            // Saved / Profile are not designed yet, so Home is the fallback.
                            Tab.Home, Tab.Saved, Tab.Profile -> HomeScreen(onOpenArtwork = { showArtwork = true })
                        }
                        PixivBottomBar(
                            selected = tab,
                            onSelect = { tabOrdinal = it.ordinal },
                            onCompose = { },
                            modifier = Modifier.align(Alignment.BottomCenter),
                        )
                    }
                }
            }
        }
    }
}
