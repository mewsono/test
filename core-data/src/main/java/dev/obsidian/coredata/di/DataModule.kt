package dev.obsidian.coredata.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import dev.obsidian.coredata.db.HistoryDao
import dev.obsidian.coredata.db.ObsidianDatabase
import dev.obsidian.coredata.db.PlaylistDao
import dev.obsidian.coredata.db.StatsDao
import dev.obsidian.coredata.db.TrackDao
import dev.obsidian.coredata.scanner.MediaScanner
import dev.obsidian.coredata.settings.SettingsRepository
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): ObsidianDatabase =
        Room.databaseBuilder(context, ObsidianDatabase::class.java, "obsidian.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun trackDao(db: ObsidianDatabase): TrackDao = db.trackDao()

    @Provides
    fun statsDao(db: ObsidianDatabase): StatsDao = db.statsDao()

    @Provides
    fun playlistDao(db: ObsidianDatabase): PlaylistDao = db.playlistDao()

    @Provides
    fun historyDao(db: ObsidianDatabase): HistoryDao = db.historyDao()

    @Provides
    @Singleton
    fun settings(@ApplicationContext context: Context): SettingsRepository = SettingsRepository(context)

    @Provides
    @Singleton
    fun scanner(@ApplicationContext context: Context, settings: SettingsRepository): MediaScanner =
        MediaScanner(context, settings)
}
