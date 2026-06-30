# Atlas — Master Implementation Plan

## Overview

12 phases, ordered by dependency. Each phase produces a testable, shippable increment.

---

## Phase 1 — Project Scaffolding

**Goal:** Bootable app with navigation, theming, and an empty shell.

- [ ] Initialize Expo project with TypeScript + Expo Router
- [ ] Set up folder structure (src/app, src/components, etc.)
- [ ] Configure TypeScript path aliases
- [ ] Install core dependencies (MMKV, SQLite, Reanimated, Gesture Handler, FlashList, Skia)
- [ ] Create theme system (Material 3 light/dark + custom themes)
- [ ] Set up Expo Router layout with tabs (Home, Library, Search, Settings)
- [ ] Create placeholder screens for all routes
- [ ] Set up splash screen
- [ ] Verify app boots cleanly on both platforms

---

## Phase 2 — Database & Storage Layer

**Goal:** Persistence layer for library, settings, and playback state.

- [ ] Set up SQLite database with schema (videos, playlists, playlist_items, settings)
- [ ] Create database service with migrations
- [ ] Build typed repository layer (VideoRepo, PlaylistRepo, SettingsRepo)
- [ ] Set up MMKV for fast key-value storage (settings, cache)
- [ ] Implement settings service wrapping MMKV
- [ ] Write database unit tests

---

## Phase 3 — Media Scanner & Library

**Goal:** Scan the device, build a media library, and display it.

- [ ] Build FileSystem scanner (recursive directory walk)
- [ ] File type filter (video extensions + subtitle extensions)
- [ ] Metadata extraction (duration, resolution, codec via FFmpeg/MediaMetadataRetriever)
- [ ] Thumbnail generation
- [ ] SQLite batch insert on scan results
- [ ] Scanner service with progress callback
- [ ] Library screen with FlashList grid
- [ ] Folder-based organization view
- [ ] Pull-to-refresh to rescan
- [ ] Recently Added / Recently Played sections

---

## Phase 4 — Video Player Engine

**Goal:** Core playback works at a service level (no UI yet).

- [ ] Create platform abstraction layer (ExoPlayer / AVPlayer)
- [ ] Build MediaEngine service (load, play, pause, seek, stop)
- [ ] Track playback state (playing, paused, buffering, ended)
- [ ] Implement time tracking (current time, duration)
- [ ] Handle playable events (error, buffering, completion)
- [ ] Support multiple video formats (MP4, MKV, AVI, MOV, WEBM, FLV, TS)
- [ ] Support audio track switching
- [ ] Support subtitle track loading
- [ ] Background audio session setup (iOS)
- [ ] Picture-in-Picture mode foundation

---

## Phase 5 — Player UI & Gestures

**Goal:** Full-screen player with gesture controls and overlay UI.

- [ ] Player screen layout (video surface + overlay)
- [ ] Play/Pause, Previous, Next controls
- [ ] Seek bar (progress + scrubbing)
- [ ] Time display (current / duration)
- [ ] Left-side brightness gesture (vertical swipe)
- [ ] Right-side volume gesture (vertical swipe)
- [ ] Horizontal swipe for seek
- [ ] Double-tap for ±10 sec skip
- [ ] Long press for 2x speed
- [ ] Pinch to zoom
- [ ] Lock controls toggle
- [ ] Playback speed selector (0.25x – 4x)
- [ ] Auto-hide overlay after inactivity

---

## Phase 6 — Library Features

**Goal:** Organize, search, and manage the media library.

- [ ] Favorites (toggle + filtered view)
- [ ] Continue Watching (resume from position)
- [ ] Playlist CRUD (create, rename, delete)
- [ ] Add/remove videos from playlists
- [ ] Search screen with real-time filtering
- [ ] Collections view
- [ ] Context menus (long-press on media items)
- [ ] Batch operations (multi-select)

---

## Phase 7 — Settings & Customization

**Goal:** Full settings screen with persistence.

- [ ] Appearance settings (theme picker, accent color)
- [ ] Playback defaults (default speed, remember position)
- [ ] Gesture settings (enable/disable specific gestures)
- [ ] Subtitle defaults (font, size, color)
- [ ] Audio defaults (equalizer preset, volume boost)
- [ ] Storage management (clear cache, rescan)
- [ ] About screen (version, licenses)
- [ ] Settings screen UI with sections

---

## Phase 8 — Subtitle Studio

**Goal:** Full subtitle customization with rich UI.

- [ ] SRT/ASS/VTT parser
- [ ] Subtitle overlay renderer
- [ ] Font selection (system fonts + bundled)
- [ ] Size slider
- [ ] Color picker
- [ ] Shadow toggle + opacity
- [ ] Outline toggle + thickness
- [ ] Background style (none, box, gradient)
- [ ] Delay adjustment (± seconds)
- [ ] Position picker (top, center, bottom)
- [ ] Preview in player
- [ ] Persist per-video subtitle settings

---

## Phase 9 — Audio Features

**Goal:** Equalizer, audio enhancements, and track management.

- [ ] Equalizer UI (10-band + presets)
- [ ] Bass Boost toggle + intensity
- [ ] Loudness normalization
- [ ] Dialogue Boost
- [ ] Volume Boost (beyond max system volume)
- [ ] Audio track selector
- [ ] Audio only mode (screen off playback)
- [ ] Persist audio settings

---

## Phase 10 — Video Enhancements

**Goal:** On-the-fly video filters and transforms.

- [ ] Brightness adjustment
- [ ] Contrast adjustment
- [ ] Saturation adjustment
- [ ] Gamma adjustment
- [ ] Temperature (warm/cool)
- [ ] Aspect ratio override (fill, fit, stretch, 16:9, 4:3, etc.)
- [ ] Rotate (90°, 180°, 270°)
- [ ] Mirror (horizontal flip)
- [ ] Crop mode
- [ ] Digital zoom
- [ ] Reset all filters button
- [ ] Persist per-video filter settings

---

## Phase 11 — Smart Tools

**Goal:** Power-user features that elevate the experience.

- [ ] Resume playback (remember position per video)
- [ ] Smart bookmarks (save named timestamps)
- [ ] Screenshots (capture frame, save to gallery)
- [ ] Sleep timer (15/30/45/60 min or end of video)
- [ ] Thumbnail extraction (pick any frame as thumbnail)
- [ ] Metadata viewer (codec, bitrate, resolution, frame rate)
- [ ] Background playback toggle
- [ ] Picture-in-Picture mode (full integration)

---

## Phase 12 — Polish & Performance

**Goal:** Ship-quality fit and finish.

- [ ] 60 FPS UI animation audit (Reanimated)
- [ ] Startup time optimization (< 500ms)
- [ ] Memory usage optimization (large libraries)
- [ ] Battery usage profiling
- [ ] Gesture responsiveness tuning
- [ ] Loading states and skeletons
- [ ] Empty state illustrations
- [ ] Error boundaries and crash recovery
- [ ] Haptic feedback on gestures
- [ ] Accessibility (screen reader support)
- [ ] Dark/OLED theme optimization
- [ ] App icon and branding assets
- [ ] Performance testing on low-end devices

---

## Future (v2.0+)

- [ ] SMB/NAS network streaming
- [ ] Local streaming (HTTP server)
- [ ] Backup & restore (library + settings)
- [ ] Plugin system
- [ ] AI-assisted organization (on-device ML)
- [ ] Desktop / TV / Tablet layouts
- [ ] Chromecast support
- [ ] Cross-device sync
