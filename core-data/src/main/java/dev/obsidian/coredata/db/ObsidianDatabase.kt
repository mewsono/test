package dev.obsidian.coredata.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        TrackEntity::class,
        TrackStatsEntity::class,
        PlaylistEntity::class,
        PlaylistTrackEntity::class,
        PlayEventEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class ObsidianDatabase : RoomDatabase() {

    abstract fun trackDao(): TrackDao
    abstract fun statsDao(): StatsDao
    abstract fun playlistDao(): PlaylistDao
    abstract fun historyDao(): HistoryDao

    companion object {
        fun build(context: Context): ObsidianDatabase =
            Room.databaseBuilder(context, ObsidianDatabase::class.java, "obsidian.db")
                .fallbackToDestructiveMigration()
                .build()
    }
}
