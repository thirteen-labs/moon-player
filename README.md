# Aura

A modern media player app built with Expo and React Native.

## Features

- Video playback with subtitles support
- Media library management
- Custom bottom sheet player
- Dark mode UI
- Gesture-based controls
- Volume management

## Tech Stack

- **Framework**: Expo SDK 56 + React Native 0.85
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **State**: Zustand
- **Navigation**: React Navigation
- **Storage**: MMKV + SQLite
- **Animations**: React Native Reanimated

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Scan the QR code with Expo Go, or press:

- `a` — open on Android
- `i` — open on iOS
- `w` — open on web

### Lint

```bash
npm run lint
```

### Typecheck

```bash
npm run typecheck
```

## Build

### APK (without EAS)

```bash
npx expo prebuild
cd android && ./gradlew assembleRelease
```

## License

MIT
