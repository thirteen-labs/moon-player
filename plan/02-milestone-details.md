# Atlas — Milestone Detail & Task Breakdown

---

## M1: Foundation (Week 1)

### Day 1 — Project Init
- `npx create-expo-app atlas --template blank-typescript`
- Install: expo-router, @react-navigation/native, react-native-screens
- Install: react-native-reanimated, react-native-gesture-handler
- Install: expo-sqlite, react-native-mmkv, expo-file-system
- Install: @shopify/flash-list, @shopify/react-native-skia
- Configure tsconfig.json path aliases (`@/` → `src/`)
- Set up ESLint + Prettier

### Day 2 — Navigation Shell
- Create `src/app/_layout.tsx` (root layout)
- Create tab navigator: Home, Library, Search, Settings
- Create placeholder screen files
- Verify all routes render

### Day 3 — Theme System
- Define theme tokens (colors, spacing, typography, shapes)
- Build `ThemeProvider` context
- Implement Material 3 light + dark palettes
- Add custom theme presets (Cyber, Forest, Ocean, Sunset, OLED)
- Build `useTheme()` hook
- Wire theme into navigation and screens

---

## M2: Data Layer (Week 2)

### Day 1 — SQLite Schema
- Create `src/database/schema.ts` with CREATE TABLE statements
- Videos table: id, title, path, folder, duration, position, size, resolution, codec, thumbnail, favorite, watched, dateAdded, lastPlayed
- Playlists table: id, name, createdAt
- PlaylistItems table: playlistId, videoId
- Settings table: key, value
- Build migration system (version-tracked schema updates)

### Day 2 — Database Service
- `DatabaseService` singleton wrapping expo-sqlite
- `exec()` / `query()` / `run()` helpers
- Prepared statement support for batch inserts
- Transaction wrapper

### Day 3 — Repositories
- `VideoRepository`: getAll, getById, search, getFavorites, getRecent, getByFolder, insert, update, delete, markWatched, toggleFavorite
- `PlaylistRepository`: CRUD + addVideo, removeVideo, getVideos
- `SettingsRepository`: get/set key-value pairs

### Day 4 — MMKV Settings
- Key-value storage for: theme, accent color, subtitle defaults, audio defaults, playback defaults, gesture settings
- `SettingsService` class with typed getters/setters
- Backward-compatible defaults

---

## M3: Media Library (Week 3)

### Day 1 — File Scanner
- Recursively walk device storage using expo-file-system
- Filter by video extensions: .mp4, .mkv, .avi, .mov, .webm, .flv, .ts
- Filter by subtitle extensions: .srt, .ass, .ssa, .vtt, .sub
- Ignore system directories, cache folders
- Debounce scans (avoid redundant scans)

### Day 2 — Metadata Extraction
- Extract: duration, width, height, codec, bitrate, frame rate
- Use `expo-video-thumbnails` for thumbnail generation
- Handle extraction errors gracefully (fallback values)

### Day 3 — Library Sync
- Compare scanned files vs database records
- Insert new files, remove deleted files
- Update metadata on re-scan
- Track scan progress (total files, current file)
- Emit events on scan completion

### Day 4 — Library UI
- `LibraryScreen` with FlashList (grid layout)
- Pull-to-refresh triggers rescan
- Filter chips: All, Videos, Folders
- Folder view: grouped by directory
- Sort options: name, date added, duration
- `VideoCard` component (thumbnail, title, duration badge)

---

## M4: Video Player (Week 4-5)

### Day 1 — Player Abstraction
- `MediaEngine` interface: load, play, pause, seek, stop, setRate, setVolume, setTrack
- Android: ExoPlayer via `react-native-video` or custom native module
- iOS: AVPlayer via `react-native-video` or custom native module
- Event callbacks: onLoad, onProgress, onEnd, onError, onBuffer

### Day 2 — Player Service
- `PlaybackService` manages current track queue
- Playback state machine (idle → loading → playing → paused → ended)
- Position tracking with periodic save (every 15s)
- Error recovery (auto-retry on transient errors)

### Day 3 — Player Screen Shell
- `PlayerScreen` route with video ID param
- Video surface fills screen
- Overlay layer (semi-transparent backdrop)
- Status bar hidden during playback

### Day 4 — Transport Controls
- Play/Pause button (center)
- Skip back 10s / Skip forward 10s
- Seek bar (track + thumb, draggable)
- Current time / remaining time
- Next / Previous track buttons
- Speed selector bottom sheet (0.25x–4x grid)

### Day 5 — Gesture System
- Gesture detector wrapper using Gesture Handler
- **Left side** vertical pan → brightness (system brightness API)
- **Right side** vertical pan → volume (system volume API)
- **Horizontal** pan anywhere → seek (with haptic feedback at keyframes)
- **Double tap** left half → -10s, right half → +10s
- **Long press** → toggle 2x speed
- **Pinch** → zoom (scale video surface)
- Gesture sensitivity configuration

### Day 6 — Overlay UX
- Auto-hide overlay after 4s of inactivity
- Tap to show/hide
- Lock button disables all gestures (only tap to unlock)
- Lock icon indicator
- Smooth fade transitions (Reanimated)

---

## M5: Library Features (Week 6)

### Day 1 — Favorites
- Heart icon toggle on VideoCard
- Favorite filter on Library screen
- Favorites section on Home screen
- Haptic feedback on toggle

### Day 2 — Continue Watching
- Track lastPlayed + position per video
- "Continue Watching" rail on Home screen
- Progress bar indicator on VideoCard
- Resume prompt when reopening video

### Day 3 — Playlists
- Create/rename/delete playlist (modal or bottom sheet)
- Add to playlist from video context menu
- Playlist detail screen (video grid)
- Reorder videos in playlist
- Empty playlist state

### Day 4 — Search
- Search bar with debounced input (300ms)
- Search across: title, folder, codec
- Recent searches (stored in MMKV, max 10)
- Clear search button
- Results appear as-you-type

### Day 5 — Home Screen
- Continue Watching horizontal rail
- Recently Added grid section
- Favorites rail
- Collections section
- Smart greeting ("Good evening")
- Quick actions (rescan, open last video)

---

## M6: Settings & Customization (Week 7)

### Day 1 — Settings Screen
- Settings screen with grouped list (iOS-style or Material 3)
- Each row navigates to detail or shows inline control

### Day 2 — Appearance Settings
- Theme picker (OLED, Dark, Light, Cyber, Forest, Ocean, Sunset)
- Accent color picker (circle palette)
- Preview theme changes live
- Persist to MMKV, apply via ThemeProvider

### Day 3 — Playback Settings
- Default playback speed
- Remember position toggle
- Background audio toggle
- Picture-in-Picture toggle
- Skip forward/back duration (5/10/15/30 sec)

### Day 4 — Gesture Settings
- Toggle each gesture individually
- Sensitivity slider for seek gesture
- Reset to defaults button

### Day 5 — Storage & About
- Clear cache button (thumbnails, temp files)
- Database size display
- App version + build number
- Open source licenses
- Links (GitHub, website, feedback)

---

## M7: Subtitle Studio (Week 8)

### Day 1 — Subtitle Parser
- SRT parser (timecodes → text segments)
- ASS/SSA parser (styles + events)
- VTT parser
- SUB parser
- Unified `SubtitleTrack` interface

### Day 2 — Subtitle Renderer
- Overlay rendered above video surface
- Text styling: font family, size, color, weight
- Shadow layer (offset + blur)
- Outline stroke
- Background box (padding, radius, opacity)
- Multi-line support

### Day 3 — Subtitle Editor UI
- Bottom sheet with all subtitle options
- Font picker (preview each font)
- Size slider (live preview on video)
- Color picker (grid of common colors + custom hex)
- Shadow toggle + intensity
- Outline toggle + thickness
- Background style picker (none, solid, gradient)
- Delay stepper (±0.5s steps)
- Position selector (top, center, bottom)

### Day 4 — Per-Video Subtitle Settings
- Save subtitle config per video in SQLite
- Auto-apply saved settings on playback
- Reset to global defaults option

---

## M8: Audio & Video Features (Week 9)

### Day 1 — Equalizer
- 10-band EQ UI (frequency sliders)
- Presets: Flat, Pop, Rock, Jazz, Classical, Bass Boost, Vocal
- Custom preset (save current sliders)
- Apply EQ via platform audio API

### Day 2 — Audio Enhancements
- Bass Boost slider
- Loudness normalization toggle
- Dialogue Boost slider (center channel emphasis)
- Volume Boost slider (0–200%)

### Day 3 — Video Filters
- Brightness (-1 to 1)
- Contrast (0 to 2)
- Saturation (0 to 2)
- Gamma (0.1 to 3)
- Temperature (cool to warm slider)
- Applied via video filter layer or Skia

### Day 4 — Video Transform
- Aspect ratio options: Fill, Fit, Stretch, 16:9, 4:3, 1:1, Custom
- Rotate: 0°, 90°, 180°, 270°
- Mirror toggle
- Digital zoom (pinch gesture or slider)
- Reset all button

---

## M9: Smart Tools & Polish (Week 10)

### Day 1 — Smart Tools
- Sleep timer (15/30/45/60 min, end of video, custom)
- Screenshot capture (canvas snapshot → save to gallery)
- Smart bookmarks (tap bookmark during playback, named list)
- Metadata viewer sheet (codec, resolution, bitrate, FPS, file size, path)

### Day 2 — Picture-in-Picture
- PIP enter/exit on Android
- PIP enter/exit on iOS
- PIP continued playback
- PIP controls (play/pause, close)

### Day 3 — Performance Optimization
- FlashList optimization (recycler, viewability)
- Image/thumbnail caching (expo-file-system cache)
- Lazy load screens (Expo Router)
- Reduce re-renders (useMemo, useCallback audit)
- SQLite query optimization (indexes, pagination)

### Day 4 — UX Polish
- Skeleton loading screens
- Empty state illustrations (per screen)
- Error states with retry buttons
- Toast notifications (scan complete, bookmark saved)
- Haptic feedback (gestures, toggles, long press)
- Animated transitions between screens

### Day 5 — Accessibility
- Screen reader labels on all controls
- Focus management
- Reduce motion setting (disable animations)
- High contrast mode
- Accessibility test pass

---

## M10: Release Preparation (Week 11)

### Day 1 — Testing
- Integration tests for critical paths (playback, scan, search)
- Edge case testing (empty library, corrupt files, permissions denied)
- Device testing (low-end Android, latest iOS)
- Battery drain test (2hr continuous playback)

### Day 2 — Bug Fixing
- Crash reporting review
- Address all P0/P1 bugs
- Regression testing

### Day 3 — Assets & Branding
- App icon (adaptive icon for Android)
- Splash screen asset
- Store screenshots
- Feature graphic

### Day 4 — Build & Deploy
- Configure app.json (version, name, scheme, permissions)
- Android: generate AAB, test on Play Store internal track
- iOS: archive, TestFlight beta
- Create changelog
