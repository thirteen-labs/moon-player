import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { readAsStringAsync } from 'expo-file-system';
import Video, { SelectedTrackType, type VideoRef } from 'react-native-video';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { usePlayer } from '@/player';
import { useSettings } from '@/storage';
import { formatDuration } from '@/utils/format';
import { triggerHaptic } from '@/utils/haptics';
import { SubtitleOverlay } from '@/subtitles/SubtitleOverlay';
import { parseSRT, parseVTT, parseASS, type SubtitleTrack } from '@/subtitles/parser';
import { Icon } from '@/components/Icon';
import type { SubtitleFile } from '@/library/types';

function titleOf(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function parseSubtitleContent(content: string, ext: string): SubtitleTrack | null {
  const e = ext.toLowerCase();
  if (e === '.srt') return parseSRT(content);
  if (e === '.vtt') return parseVTT(content);
  if (e === '.ass' || e === '.ssa') return parseASS(content);
  return null;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

interface TrackOption {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function PlayerRoute() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings } = useSettings();

  const {
    currentVideo, isPlaying, buffering, position, duration,
    videoRef, togglePlay, seekTo, onProgress, onLoad, onEnd, onError,
    onBuffer, onPlaybackStateChanged, onPictureInPictureStatusChanged,
    playbackSpeed, setPlaybackSpeed, volume, isMuted, toggleMute, setVolume,
    next, previous, currentIndex, queue,
    audioTracks, selectedAudioTrack, setSelectedAudioTrack,
    textTracks, selectedTextTrack, setSelectedTextTrack,
    isAudioOnly, setAudioOnly,
    isPiPActive, enterPiP, exitPiP,
    playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
  } = usePlayer();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
  const [longPressSpeed, setLongPressSpeed] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const [brightness, setBrightness] = useState(1);
  const [gestureZone, setGestureZone] = useState<'brightness' | 'volume' | 'seek' | null>(null);
  const [trackSheet, setTrackSheet] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [externalTrack, setExternalTrack] = useState<SubtitleTrack | null>(null);
  const [externalUri, setExternalUri] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  const { width: W, height: H } = useWindowDimensions();
  const skipAmount = settings.skipDuration || 10;

  useEffect(() => { if (!currentVideo) router.replace('/'); }, [currentVideo, router]);

  // In fullscreen, hide the status bar and lock the device to landscape so the
  // video uses the full screen. Restore portrait when leaving fullscreen/unmount.
  useEffect(() => {
    StatusBar.setHidden(fullscreen, 'fade');
    const applyOrientation = async () => {
      try {
        if (fullscreen) {
          await lockAsync(OrientationLock.LANDSCAPE);
        } else {
          await lockAsync(OrientationLock.PORTRAIT_UP);
        }
      } catch {
        // Orientation lock may be unavailable on some platforms/configs.
      }
    };
    applyOrientation();
    return () => {
      StatusBar.setHidden(false, 'fade');
      lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!controlsVisible || !settings.autoHideControls) return;
    const timer = setTimeout(() => setControlsVisible(false), settings.autoHideDelay);
    return () => clearTimeout(timer);
  }, [controlsVisible, settings.autoHideControls, settings.autoHideDelay]);

  const showControls = useCallback(() => setControlsVisible(true), []);

  const handleLoad = useCallback((data: { duration: number }) => {
    onLoad(data);
    setLocalVolume(volume);
    // A new video loaded — drop any previously selected external subtitle.
    setExternalTrack(null);
    setExternalUri(null);
    if (position > 1) {
      const target = position;
      setTimeout(() => videoRef.current?.seek(target), 60);
    }
  }, [onLoad, position, volume, videoRef]);

  const handleSkip = useCallback((seconds: number) => {
    seekTo(position + seconds);
    triggerHaptic('light');
  }, [seekTo, position]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(playbackSpeed);
    setPlaybackSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  }, [playbackSpeed, setPlaybackSpeed]);

  const handlePip = useCallback(() => {
    if (isPiPActive) exitPiP();
    else enterPiP();
  }, [isPiPActive, enterPiP, exitPiP]);

  const handleFullscreen = useCallback(() => setFullscreen((f) => !f), []);

  const loadExternalSubtitle = useCallback(async (sub: SubtitleFile) => {
    if (externalUri === sub.uri && externalTrack) return;
    try {
      const content = await readAsStringAsync(sub.uri, { encoding: 'utf8' });
      const track = parseSubtitleContent(content, sub.extension);
      if (track) {
        setExternalTrack({ ...track, title: sub.name });
        setExternalUri(sub.uri);
        // Disable native text track so the JS overlay is the only renderer.
        setSelectedTextTrack(-1);
      }
    } catch {
      // Subtitle file could not be read (permissions, encoding) — ignore.
    }
  }, [externalUri, externalTrack, setSelectedTextTrack]);

  const selectTextTrack = useCallback((index: number) => {
    const embeddedCount = textTracks.length;
    if (index < 0) {
      setSelectedTextTrack(-1);
      setExternalTrack(null);
      setExternalUri(null);
      return;
    }
    if (index < embeddedCount) {
      setSelectedTextTrack(index);
      setExternalTrack(null);
      setExternalUri(null);
    } else {
      const sub = currentVideo?.subtitles[index - embeddedCount];
      if (sub) void loadExternalSubtitle(sub);
    }
  }, [textTracks.length, currentVideo, loadExternalSubtitle, setSelectedTextTrack]);

  const retry = useCallback(() => {
    if (!currentVideo) return;
    try {
      videoRef.current?.setSource?.({ uri: currentVideo.file.uri });
      videoRef.current?.resume?.();
    } catch {
      // ignore
    }
  }, [currentVideo, videoRef]);

  /* eslint-disable react-hooks/refs */
  const seekStart = useRef(0);
  const volumeStart = useRef(volume);
  const brightnessStart = useRef(brightness);
  const zoneRef = useRef<'brightness' | 'volume' | 'seek' | null>(null);
  const seekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pan = Gesture.Pan()
    .minDistance(8)
    .onBegin((e) => {
      const zone = e.x < W * 0.2 ? 'brightness' : e.x > W * 0.8 ? 'volume' : 'seek';
      zoneRef.current = zone;
      setGestureZone(zone);
      seekStart.current = position;
      volumeStart.current = localVolume;
      brightnessStart.current = brightness;
      if (zone === 'seek') {
        setScrubbing(true);
        setScrubPosition(position);
      }
      showControls();
    })
    .onUpdate((e) => {
      if (zoneRef.current === 'brightness') {
        setBrightness(Math.max(0.1, Math.min(1, brightnessStart.current - (e.translationY / H) * 0.6)));
      } else if (zoneRef.current === 'volume') {
        const nv = Math.max(0, Math.min(1, volumeStart.current - (e.translationY / H) * 0.6));
        setLocalVolume(nv);
        videoRef.current?.setVolume(nv);
        setVolume(nv);
        if (nv > 0 && isMuted) toggleMute();
      } else {
        const delta = (e.translationX / W) * duration;
        const target = Math.max(0, Math.min(seekStart.current + delta, duration));
        setScrubPosition(target);
        // Throttle native seeks during a scrub; commit the latest position.
        if (seekTimer.current) clearTimeout(seekTimer.current);
        seekTimer.current = setTimeout(() => {
          videoRef.current?.seek(target);
        }, 120);
      }
    })
    .onEnd((e) => {
      if (zoneRef.current === 'seek') {
        if (seekTimer.current) clearTimeout(seekTimer.current);
        const delta = (e.translationX / W) * duration;
        const target = Math.max(0, Math.min(seekStart.current + delta, duration));
        seekTo(target);
        setScrubbing(false);
      }
      zoneRef.current = null;
      setGestureZone(null);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => { handleSkip(e.x < W / 2 ? -skipAmount : skipAmount); showControls(); });

  const singleTap = Gesture.Tap().onEnd(() => setControlsVisible((v) => !v));

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => { setLongPressSpeed(true); setPlaybackSpeed(2.0); })
    .onEnd(() => { setLongPressSpeed(false); });

  const pinch = Gesture.Pinch()
    .onEnd((e) => {
      if (e.scale > 1.15) setResizeMode('cover');
      else if (e.scale < 0.85) setResizeMode('contain');
    });

  const composed = Gesture.Simultaneous(pan, Gesture.Exclusive(doubleTap, singleTap), longPress, pinch);
  /* eslint-enable react-hooks/refs */

  if (!currentVideo) return null;

  const videoSource = { uri: currentVideo.file.uri };
  const shownPosition = scrubbing ? scrubPosition : position;
  const progress = duration > 0 ? shownPosition / duration : 0;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const backgroundAudio = isBackgroundAudioEnabled || isAudioOnly;

  // Unified track option lists for the sheet.
  const audioOptions: TrackOption[] = [
    ...audioTracks.map((t, i) => ({
      key: `a${i}`,
      label: `Track ${i + 1}${t.language ? ` (${t.language})` : ''}`,
      active: selectedAudioTrack === i,
      onPress: () => setSelectedAudioTrack(i),
    })),
  ];
  const textOptions: TrackOption[] = [
    {
      key: 'off',
      label: 'Off',
      active: selectedTextTrack < 0 && !externalTrack,
      onPress: () => selectTextTrack(-1),
    },
    ...textTracks.map((t, i) => ({
      key: `e${i}`,
      label: `Track ${i + 1}${t.language ? ` (${t.language})` : ''}`,
      active: selectedTextTrack === i,
      onPress: () => selectTextTrack(i),
    })),
    ...(currentVideo.subtitles ?? []).map((s, i) => ({
      key: `x${i}`,
      label: `${s.name}${s.language !== 'Unknown' ? ` (${s.language})` : ''}`,
      active: externalUri === s.uri,
      onPress: () => selectTextTrack(textTracks.length + i),
    })),
  ];

  const audioTrackProp =
    selectedAudioTrack >= 0
      ? { type: SelectedTrackType.INDEX, value: selectedAudioTrack }
      : { type: SelectedTrackType.SYSTEM };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <GestureDetector gesture={composed}>
        <View style={fullscreen ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : { flex: 1 }}>
          <Video
            ref={videoRef as React.RefObject<VideoRef>}
            source={videoSource}
            style={{ flex: 1 }}
            resizeMode={resizeMode}
            paused={!isPlaying}
            rate={longPressSpeed ? 2.0 : playbackSpeed}
            volume={isMuted ? 0 : localVolume}
            muted={isMuted}
            playInBackground={backgroundAudio}
            playWhenInactive={backgroundAudio}
            onLoad={handleLoad}
            onProgress={onProgress}
            onEnd={onEnd}
            onError={(e) => onError(new Error(e.error?.errorString ?? 'Video error'))}
            onBuffer={onBuffer}
            onPlaybackStateChanged={onPlaybackStateChanged}
            onPictureInPictureStatusChanged={onPictureInPictureStatusChanged}
            progressUpdateInterval={250}
            selectedAudioTrack={audioTrackProp}
            selectedTextTrack={selectedTextTrack >= 0 ? { type: SelectedTrackType.INDEX, value: selectedTextTrack } : undefined}
          />
          <SubtitleOverlay track={externalTrack ?? undefined} />

          {buffering ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : null}

          {playbackState === 'error' ? (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <Text style={{ color: '#fff', fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginBottom: spacing.md }}>Playback failed</Text>
              <Pressable hitSlop={10} onPress={retry} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.md }}>
                <Text style={{ color: '#fff' }}>Retry</Text>
              </Pressable>
              <Pressable hitSlop={10} onPress={() => router.back()} style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.textSecondary }}>Back to library</Text>
              </Pressable>
            </View>
          ) : null}

          {brightness < 1 ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `rgba(0,0,0,${((1 - brightness) * 0.7).toFixed(2)})` }} />
          ) : null}

          {gestureZone ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' }}>
              {gestureZone === 'brightness' ? (
                <View style={{ left: spacing.lg, alignItems: 'center' }}>
                  <Icon name="grid" size={18} color="#fff" />
                  <View style={{ width: 4, height: 90, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <View style={{ width: 4, height: `${brightness * 100}%`, backgroundColor: '#fff' }} />
                  </View>
                </View>
              ) : (
                <View style={{ right: 0, left: W - spacing.lg - 24, alignItems: 'center' }}>
                  <Icon name="list" size={18} color="#fff" />
                  <View style={{ width: 4, height: 90, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <View style={{ width: 4, height: `${localVolume * 100}%`, backgroundColor: '#fff' }} />
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </GestureDetector>

      {controlsVisible && playbackState !== 'error' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable hitSlop={10} onPress={() => router.back()} accessibilityLabel="Back">
            <Icon name="back" size={24} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.md, flex: 1 }} numberOfLines={1}>
            {titleOf(currentVideo.file.name)}
          </Text>
          <Pressable hitSlop={10} onPress={() => { triggerHaptic('light'); toggleMute(); }} accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
            <Text style={{ color: '#fff', fontSize: 20 }}>{isMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={cycleSpeed} accessibilityLabel="Playback speed">
            <Text style={{ color: '#fff', fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginLeft: spacing.md }}>{playbackSpeed}x</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={() => setTrackSheet(true)} accessibilityLabel="Audio and subtitle tracks" style={{ marginLeft: spacing.md }}>
            <Icon name="more" size={22} color="#fff" />
          </Pressable>
          <Pressable hitSlop={10} onPress={handleFullscreen} accessibilityLabel="Fullscreen" style={{ marginLeft: spacing.md }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>{fullscreen ? '⤡' : '⤢'}</Text>
          </Pressable>
          <Pressable hitSlop={10} onPress={handlePip} accessibilityLabel="Picture in picture" style={{ marginLeft: spacing.md }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>◰</Text>
          </Pressable>
        </View>
      )}

      {controlsVisible && playbackState !== 'error' && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.lg, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ height: 4, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: spacing.sm }}>
            <View style={{ height: 4, width: `${progress * 100}%`, borderRadius: borderRadius.full, backgroundColor: colors.primary }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: typography.sizes.xs }}>{formatDuration(shownPosition)}</Text>
            <Text style={{ color: '#fff', fontSize: typography.sizes.xs }}>{formatDuration(duration)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md }}>
            <Pressable hitSlop={10} disabled={!canPrev} onPress={() => { triggerHaptic('light'); previous(); }} accessibilityLabel="Previous">
              <Icon name="prev" size={26} color={canPrev ? '#fff' : 'rgba(255,255,255,0.35)'} />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => { triggerHaptic('light'); seekTo(position - skipAmount); }} accessibilityLabel="Skip back">
              <Text style={{ color: '#fff', fontSize: 22 }}>⏪</Text>
            </Pressable>
            <Pressable hitSlop={10} onPress={() => { triggerHaptic('light'); togglePlay(); }} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
              <Icon name={isPlaying ? 'pause' : 'play'} size={36} color="#fff" />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => { triggerHaptic('light'); seekTo(position + skipAmount); }} accessibilityLabel="Skip forward">
              <Text style={{ color: '#fff', fontSize: 22 }}>⏩</Text>
            </Pressable>
            <Pressable hitSlop={10} disabled={!canNext} onPress={() => { triggerHaptic('light'); next(); }} accessibilityLabel="Next">
              <Icon name="next" size={26} color={canNext ? '#fff' : 'rgba(255,255,255,0.35)'} />
            </Pressable>
          </View>
        </View>
      )}

      <TrackSheet
        visible={trackSheet}
        onClose={() => setTrackSheet(false)}
        audioOptions={audioOptions}
        textOptions={textOptions}
        isAudioOnly={isAudioOnly}
        setAudioOnly={setAudioOnly}
        isBackgroundAudioEnabled={isBackgroundAudioEnabled}
        toggleBackgroundAudio={toggleBackgroundAudio}
      />
    </View>
  );
}

interface TrackSheetProps {
  visible: boolean;
  onClose: () => void;
  audioOptions: TrackOption[];
  textOptions: TrackOption[];
  isAudioOnly: boolean;
  setAudioOnly: (v: boolean) => void;
  isBackgroundAudioEnabled: boolean;
  toggleBackgroundAudio: () => void;
}

function TrackSheet({
  visible, onClose,
  audioOptions, textOptions,
  isAudioOnly, setAudioOnly,
  isBackgroundAudioEnabled, toggleBackgroundAudio,
}: TrackSheetProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  const renderRow = (opt: TrackOption) => (
    <Pressable key={opt.key} onPress={opt.onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>{opt.label}</Text>
      {opt.active ? <Icon name="heart" size={16} color={colors.primary} /> : null}
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing['2xl'] }}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>Audio</Text>
          {renderRow({ key: 'audioonly', label: 'Off (muted video)', active: isAudioOnly, onPress: () => setAudioOnly(!isAudioOnly) })}
          {renderRow({ key: 'background', label: 'Background audio', active: isBackgroundAudioEnabled, onPress: () => toggleBackgroundAudio() })}
          {audioOptions.map(renderRow)}

          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: 1, marginVertical: spacing.sm }}>Subtitles</Text>
          {textOptions.map(renderRow)}
        </View>
      </Pressable>
    </Modal>
  );
}
