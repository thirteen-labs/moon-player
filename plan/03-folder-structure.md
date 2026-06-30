# Atlas — Folder Structure & Scaffolding Plan

## Root Layout

```
atlas/
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
├── assets/
│   ├── fonts/
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   ├── Inter-SemiBold.ttf
│   │   └── Inter-Bold.ttf
│   ├── icons/
│   │   ├── app-icon.png
│   │   ├── app-icon-adaptive.png
│   │   └── favicon.png
│   └── images/
│       ├── splash.png
│       ├── empty-library.png
│       └── empty-playlist.png
└── src/
```

---

## Source Structure

### App Router (`src/app/`)

```
src/app/
├── _layout.tsx              # Root layout (ThemeProvider, DB init)
├── index.tsx                # Splash → redirect
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator config
│   ├── index.tsx            # Home screen
│   ├── library.tsx          # Library screen
│   ├── search.tsx           # Search screen
│   └── settings.tsx         # Settings screen
├── player/
│   ├── [id].tsx             # Player screen (dynamic route)
│   └── _layout.tsx          # Player layout (hide tabs)
├── playlist/
│   ├── [id].tsx             # Playlist detail screen
│   └── new.tsx              # Create playlist screen
├── folder/
│   └── [path].tsx           # Folder contents screen
└── settings/
    ├── appearance.tsx
    ├── playback.tsx
    ├── gestures.tsx
    ├── subtitles.tsx
    ├── audio.tsx
    ├── storage.tsx
    └── about.tsx
```

### Components (`src/components/`)

```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── Slider.tsx
│   ├── Switch.tsx
│   ├── BottomSheet.tsx
│   ├── Modal.tsx
│   ├── Chip.tsx
│   ├── Toast.tsx
│   └── Skeleton.tsx
├── video/
│   ├── VideoCard.tsx
│   ├── VideoGrid.tsx
│   ├── VideoRow.tsx
│   └── VideoThumbnail.tsx
├── player/
│   ├── TransportControls.tsx
│   ├── SeekBar.tsx
│   ├── SpeedSelector.tsx
│   ├── Overlay.tsx
│   ├── GestureOverlay.tsx
│   └── LockButton.tsx
├── library/
│   ├── ContinueWatchingRail.tsx
│   ├── RecentlyAddedGrid.tsx
│   ├── FavoritesRail.tsx
│   ├── FolderList.tsx
│   └── SearchBar.tsx
├── subtitle/
│   ├── SubtitleOverlay.tsx
│   ├── SubtitleEditor.tsx
│   └── FontPicker.tsx
├── audio/
│   ├── EqualizerUI.tsx
│   ├── BandSlider.tsx
│   └── PresetPicker.tsx
├── settings/
│   ├── SettingsRow.tsx
│   ├── SettingsSection.tsx
│   ├── ThemePicker.tsx
│   └── ColorPicker.tsx
├── playlist/
│   ├── PlaylistCard.tsx
│   └── AddToPlaylistSheet.tsx
└── shared/
    ├── EmptyState.tsx
    ├── ErrorBoundary.tsx
    ├── LoadingSpinner.tsx
    └── ContextMenu.tsx
```

### Screens (`src/screens/` — routed via app/, kept for heavy logic)

```
src/screens/
├── HomeScreen.tsx
├── LibraryScreen.tsx
├── SearchScreen.tsx
├── PlayerScreen.tsx
├── SettingsScreen.tsx
├── PlaylistDetailScreen.tsx
├── FolderScreen.tsx
├── SettingsAppearance.tsx
├── SettingsPlayback.tsx
├── SettingsGestures.tsx
├── SettingsSubtitles.tsx
├── SettingsAudio.tsx
├── SettingsStorage.tsx
└── SettingsAbout.tsx
```

### Player (`src/player/`)

```
src/player/
├── MediaEngine.ts           # Platform abstraction (interface)
├── MediaEngine.android.ts   # ExoPlayer implementation
├── MediaEngine.ios.ts       # AVPlayer implementation
├── PlaybackService.ts       # State machine, queue, position tracking
├── PlayerContext.tsx         # React context for current player state
├── usePlayback.ts           # Hook: controls, state, events
├── useGestureController.ts  # Gesture → action mapping
└── types.ts                 # PlayerState, Track, etc.
```

### Library (`src/library/`)

```
src/library/
├── LibraryService.ts        # Scan orchestration, diff logic
├── Scanner.ts               # File system walker
├── MetadataExtractor.ts     # Media info extraction
├── ThumbnailGenerator.ts    # Frame capture
├── useLibrary.ts            # Hook: library state, scan trigger
└── types.ts
```

### Database (`src/database/`)

```
src/database/
├── DatabaseService.ts       # Singleton, connection, migration runner
├── migrations/
│   ├── 001_initial.ts
│   └── 002_subtitle_settings.ts
├── repositories/
│   ├── VideoRepository.ts
│   ├── PlaylistRepository.ts
│   └── SettingsRepository.ts
├── schema.ts                # Table definitions + CREATE statements
└── types.ts                 # DB row types
```

### Hooks (`src/hooks/`)

```
src/hooks/
├── useTheme.ts
├── useDatabase.ts
├── useScanner.ts
├── usePlayback.ts           (or in player/)
├── useSettings.ts
├── useGestures.ts
├── useSubtitleSettings.ts
├── useAudioSettings.ts
├── useVideoFilters.ts
├── useSleepTimer.ts
├── useBookmarks.ts
├── useScreenshot.ts
├── useOrientation.ts
└── useAccessibility.ts
```

### Services (`src/services/`)

```
src/services/
├── SettingsService.ts       # MMKV wrapper
├── ThemeService.ts          # Theme apply/persist
├── FileService.ts           # File system helpers
├── PermissionsService.ts    # Storage permission requests
├── PictureInPictureService.ts
├── BackgroundAudioService.ts
├── ScreenshotService.ts
└── SleepTimerService.ts
```

### Subtitle (`src/subtitle/`)

```
src/subtitle/
├── SubtitleParser.ts        # Unified parser interface
├── parsers/
│   ├── SRTParser.ts
│   ├── ASSParser.ts
│   ├── VTTParser.ts
│   └── SUBParser.ts
├── SubtitleRenderer.tsx     # React component for rendering
├── SubtitleService.ts       # Timing, sync, style management
└── types.ts
```

### Theme (`src/theme/`)

```
src/theme/
├── ThemeProvider.tsx
├── themes.ts                # All theme definitions
├── tokens.ts                # Spacing, radii, typography scale
├── colors.ts                # Material 3 palette generator
├── useTheme.ts              # (or in hooks/)
└── types.ts
```

### Storage (`src/storage/`)

```
src/storage/
├── MMKVService.ts           # MMKV init + helpers
├── CacheService.ts          # Thumbnail/temp cache management
└── keys.ts                  # All MMKV key constants
```

### Utils (`src/utils/`)

```
src/utils/
├── formatTime.ts            # seconds → "1:23:45"
├── formatBytes.ts           # bytes → "1.5 GB"
├── formatDate.ts            # timestamp → "2 days ago"
├── debounce.ts
├── throttle.ts
├── fileExtensions.ts        # Video/subtitle extension sets
├── platform.ts              # Platform detection helpers
├── haptics.ts               # Haptic feedback wrappers
└── logger.ts                # Structured logging
```

### Types (`src/types/`)

```
src/types/
├── video.ts
├── playlist.ts
├── settings.ts
├── player.ts
├── subtitle.ts
├── theme.ts
├── audio.ts
├── filters.ts
└── navigation.ts
```

---

## Scaffolding Order

| Step | Action |
|------|--------|
| 1 | Create root `src/` directory and all subdirectories |
| 2 | Create `src/app/` router files (layouts + placeholder screens) |
| 3 | Create `src/types/` — define all interfaces first |
| 4 | Create `src/theme/` — theme system |
| 5 | Create `src/database/` — schema + service + repos |
| 6 | Create `src/storage/` — MMKV service |
| 7 | Create `src/services/` — settings, file, permissions |
| 8 | Create `src/hooks/` — all hooks |
| 9 | Create `src/player/` — engine + service + context |
| 10 | Create `src/library/` — scanner + metadata |
| 11 | Create `src/subtitle/` — parsers + renderer |
| 12 | Create `src/components/` — all component trees |
| 13 | Create `src/screens/` — screen implementations |
| 14 | Create `src/utils/` — utility functions |
| 15 | Create `assets/` — fonts, icons, images |
