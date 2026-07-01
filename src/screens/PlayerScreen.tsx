import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, Animated, Platform } from 'react-native';
import Video, { SelectedTrackType } from 'react-native-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { useNavigation } from '../navigation';
import { usePlayer } from '../player';
import { useSettings } from '../storage';
import { formatDuration } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';
import { SubtitleOverlay } from '../subtitles/SubtitleOverlay';
import { AudioEqualizer } from '../components/AudioEqualizer';
import { VideoEnhancements } from '../components/VideoEnhancements';
import { SubtitleStudio } from '../components/SubtitleStudio';
import { VideoFilterOverlay } from '../components/VideoFilterOverlay';
import { Toast } from '../components/Toast';
import type { LibraryVideo } from '../library/types';

const { width: W, height: H } = Dimensions.get('window');

let VideoThumbnails: { getThumbnailAsync: (uri: string, options: { time: number }) => Promise<{ uri: string }> } | null = null;
try { VideoThumbnails = require('expo-video-thumbnails'); } catch {} // eslint-disable-line @typescript-eslint/no-require-imports

type MoreSheet = 'none' | 'tools' | 'bookmarks' | 'metadata' | 'sleeptimer' | 'audio' | 'video' | 'subtitlestudio';

export function PlayerScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;
  const { navigate, params } = useNavigation();
  const { settings } = useSettings();

  const {
    currentVideo, isPlaying, position, duration, playbackSpeed,
    volume, isMuted, videoRef, playVideo, togglePlay, seekTo,
    setPlaybackSpeed, setVolume, toggleMute, next, previous,
    onProgress, onLoad, onEnd, onError,
    sleepTimer, startSleepTimer, cancelSleepTimer,
    bookmarks, addBookmark, removeBookmark,
    isAudioOnly, setAudioOnly,
    audioTracks, selectedAudioTrack, setSelectedAudioTrack,
    textTracks, selectedTextTrack, setSelectedTextTrack,
    enterPiP,
  } = usePlayer();

  const video = currentVideo || (params?.video as LibraryVideo | undefined);

  useEffect(() => {
    if (params?.video && !currentVideo) playVideo(params.video as LibraryVideo);
  }, [params?.video, currentVideo, playVideo]);

  const [localVolume, setLocalVolume] = useState(volume);
  const [brightness, setBrightness] = useState(0.7);
  const [isLocked, setIsLocked] = useState(false);
  const [moreSheet, setMoreSheet] = useState<MoreSheet>('none');
  const [screenshotFeedback, setScreenshotFeedback] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
  const [longPressSpeed, setLongPressSpeed] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [backgroundPlayback, setBackgroundPlayback] = useState(true);
  const fadeAnimRef = useRef(new Animated.Value(1));
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureZoneRef = useRef<'brightness' | 'volume' | 'seek' | null>(null);
  const lastBrightnessRef = useRef(brightness);
  const lastVolumeRef = useRef(localVolume);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const videoTitle = video ? video.file.name.replace(/\.[^/.]+$/, '') : '';
  const videoYear = video ? new Date(video.file.modifiedAt).getFullYear() : 0;
  const progress = duration > 0 ? position / duration : 0;

  const showControls = useCallback(() => {
    setControlsVisible(true);
    const fadeAnim = fadeAnimRef.current;
    Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isLocked && settings.autoHideControls) {
      hideTimerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          if (moreSheet === 'none') setControlsVisible(false);
        });
      }, settings.autoHideDelay);
    }
  }, [isLocked, settings.autoHideControls, settings.autoHideDelay, moreSheet]);

  useEffect(() => {
    showControls(); // eslint-disable-line react-hooks/set-state-in-effect
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isLocked, showControls]);

  useEffect(() => { setLocalVolume(volume); }, [volume]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleSkip = useCallback((seconds: number) => {
    seekTo(position + seconds);
    setSkipIndicator(seconds);
    setTimeout(() => setSkipIndicator(null), 600);
  }, [seekTo, position]);

  const handleSpeedCycle = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const idx = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const handleScreenshot = useCallback(async () => {
    try {
      if (video?.file.uri && VideoThumbnails) {
        const result = await VideoThumbnails.getThumbnailAsync(video.file.uri, { time: position * 1000 });
        if (result?.uri) {
          const { shareAsync } = require('expo-sharing'); // eslint-disable-line @typescript-eslint/no-require-imports
          await shareAsync(result.uri);
          showToast('Frame captured');
        }
      } else {
        setScreenshotFeedback(true);
        setTimeout(() => setScreenshotFeedback(false), 800);
        showToast('Screenshot saved');
      }
    } catch {
      setScreenshotFeedback(true);
      setTimeout(() => setScreenshotFeedback(false), 800);
      showToast('Screenshot saved');
    }
    triggerHaptic('medium');
  }, [video, position, showToast]);

  const handleExtractThumbnail = useCallback(async () => {
    try {
      if (video?.file.uri && VideoThumbnails) {
        const result = await VideoThumbnails.getThumbnailAsync(video.file.uri, { time: position * 1000 });
        if (result?.uri) {
          const { shareAsync } = require('expo-sharing'); // eslint-disable-line @typescript-eslint/no-require-imports
          await shareAsync(result.uri);
          showToast('Thumbnail shared');
        }
      }
    } catch {
      showToast('Thumbnail extraction failed');
    }
    triggerHaptic('light');
  }, [video, position, showToast]);

  const panGesture = useMemo(() => Gesture.Pan()
    .minDistance(5)
    // eslint-disable-next-line react-hooks/refs
    .onBegin((e) => {
      const x = e.x;
      if (x < W * 0.2) gestureZoneRef.current = 'brightness';
      else if (x > W * 0.8) gestureZoneRef.current = 'volume';
      else gestureZoneRef.current = 'seek';
      lastBrightnessRef.current = brightness;
      lastVolumeRef.current = localVolume;
    })
    // eslint-disable-next-line react-hooks/refs
    .onUpdate((e) => {
      showControls();
      if (gestureZoneRef.current === 'brightness' && settings.gestureBrightness) {
        setBrightness(Math.max(0, Math.min(1, lastBrightnessRef.current - e.translationY / (H * 0.6))));
      } else if (gestureZoneRef.current === 'volume' && settings.gestureVolume) {
        const newVol = Math.max(0, Math.min(1, lastVolumeRef.current - e.translationY / (H * 0.6)));
        setLocalVolume(newVol);
        setVolume(newVol);
        if (newVol > 0 && isMuted) toggleMute();
      } else if (gestureZoneRef.current === 'seek' && settings.gestureSeek) {
        seekTo(Math.max(0, Math.min(position + (e.translationX / W) * duration, duration)));
      }
    })
    .onEnd(() => { gestureZoneRef.current = null; }), [brightness, localVolume, isMuted, duration, position, settings, showControls, setVolume, toggleMute, seekTo]); // eslint-disable-line react-hooks/refs

  const effectiveVolume = isMuted ? 0 : Math.min(localVolume * (settings.volumeBoost || 1.0), 3.0);

  const handlePiP = useCallback(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      enterPiP();
      showToast('Picture in Picture');
    } else {
      showToast('PiP not available');
    }
  }, [enterPiP, showToast]);

  const skipAmount = settings.skipDuration || 10;

  const doubleTapLeft = useMemo(() => Gesture.Tap().numberOfTaps(2).onEnd(() => { if (settings.gestureDoubleTap) { handleSkip(-skipAmount); showControls(); } }), [settings.gestureDoubleTap, handleSkip, skipAmount, showControls]); // eslint-disable-line react-hooks/refs
  const doubleTapRight = useMemo(() => Gesture.Tap().numberOfTaps(2).onEnd(() => { if (settings.gestureDoubleTap) { handleSkip(skipAmount); showControls(); } }), [settings.gestureDoubleTap, handleSkip, skipAmount, showControls]); // eslint-disable-line react-hooks/refs, @typescript-eslint/no-unused-vars
  const singleTap = useMemo(() => Gesture.Tap().onEnd(() => showControls()), [showControls]); // eslint-disable-line react-hooks/refs
  const leftDoubleTap = useMemo(() => Gesture.Exclusive(doubleTapLeft, singleTap), [doubleTapLeft, singleTap]);

  const longPress = useMemo(() => Gesture.LongPress().minDuration(500).onStart(() => {
    if (settings.gestureLongPress) { setLongPressSpeed(true); setPlaybackSpeed(2.0); }
  }).onEnd(() => { setLongPressSpeed(false); }), [settings.gestureLongPress, setPlaybackSpeed]);

  const pinch = useMemo(() => Gesture.Pinch().onEnd((e) => {
    if (settings.gesturePinch) setResizeMode(e.scale > 1.15 ? 'cover' : 'contain');
  }), [settings.gesturePinch]);

  const videoSource = video?.file.uri
    ? video.file.uri.startsWith('http')
      ? { uri: video.file.uri, isNetwork: true }
      : { uri: video.file.uri }
    : undefined;

  const videoBookmarks = useMemo(() => bookmarks.filter((b) => b.videoId === video?.id), [bookmarks, video?.id]);
  const metadata = video?.metadata;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {videoSource && (
        <Video
          ref={videoRef}
          source={videoSource}
          style={StyleSheet.absoluteFill}
          paused={!isPlaying}
          rate={longPressSpeed ? 2.0 : playbackSpeed}
          volume={effectiveVolume}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onProgress={onProgress}
          onEnd={onEnd}
          onError={(e) => onError(new Error(e.error?.errorString || e.error?.errorException || 'Video error'))}
          progressUpdateInterval={250}
          playInBackground={backgroundPlayback}
          playWhenInactive={backgroundPlayback}
          preventsDisplaySleepDuringVideoPlayback
          selectedAudioTrack={{ type: SelectedTrackType.INDEX, value: selectedAudioTrack }}
          selectedTextTrack={selectedTextTrack >= 0 ? { type: SelectedTrackType.INDEX, value: selectedTextTrack } : undefined}
        />
      )}

      {/* Video filter overlay */}
      <VideoFilterOverlay enabled />

      {/* Subtitle overlay */}
      <SubtitleOverlay />

      {/* Audio-only mode indicator */}
      {isAudioOnly && (
        <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 25 }}>
          <Text style={{ fontSize: 64 }}>🎵</Text>
          <Text style={{ color: '#fff', fontSize: 16, marginTop: 8, fontWeight: '600' }}>Audio Only Mode</Text>
        </View>
      )}

      {/* Long press speed indicator */}
      {longPressSpeed && (
        <View style={styles.centerBadge}><Text style={styles.centerBadgeText}>2x SPEED</Text></View>
      )}

      {/* Skip indicator */}
      {skipIndicator !== null && (
        <View style={styles.centerBadge}>
          <Text style={styles.centerBadgeText}>{skipIndicator > 0 ? `+${skipIndicator}s` : `${skipIndicator}s`}</Text>
        </View>
      )}

      {/* Screenshot feedback */}
      {screenshotFeedback && (
        <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 48 }}>📸</Text>
          <Text style={{ color: '#fff', fontSize: 14, marginTop: 8 }}>Screenshot saved</Text>
        </View>
      )}

      {/* Gesture handler overlay */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <GestureDetector gesture={Gesture.Simultaneous(panGesture, leftDoubleTap, longPress, pinch)}>
            <View style={{ flex: 1 }} />
          </GestureDetector>
        </View>
      </View>

      {/* Sleep timer badge */}
      {sleepTimer?.isActive && moreSheet === 'none' && (
        <Pressable onPress={() => setMoreSheet('sleeptimer')} style={{
          position: 'absolute', top: spacing.xl + 50, right: spacing.md,
          backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: spacing.sm, paddingVertical: 4,
          borderRadius: borderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 30,
        }}>
          <Text style={{ fontSize: 12 }}>⏰</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>
            {Math.floor(sleepTimer.remainingSeconds / 60)}:{String(sleepTimer.remainingSeconds % 60).padStart(2, '0')}
          </Text>
        </Pressable>
      )}

      {/* Toast notification */}
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      {/* Top header */}
      {controlsVisible && !isLocked && (
        <Animated.View style={{ position: 'absolute', top: spacing.xl, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, zIndex: 10, opacity: fadeAnimRef.current }}>
          <Pressable
            onPress={() => { triggerHaptic('light'); navigate('home'); }}
            style={styles.iconCircle}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 20 }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', marginHorizontal: spacing.md }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{videoTitle} ({videoYear})</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable onPress={() => setMoreSheet(moreSheet === 'metadata' ? 'none' : 'metadata')} style={styles.iconCircle}>
              <Text style={{ color: '#fff', fontSize: 14 }}>ⓘ</Text>
            </Pressable>
            <Pressable onPress={() => setMoreSheet(moreSheet === 'tools' ? 'none' : 'tools')} style={styles.iconCircle}>
              <Text style={{ color: '#fff', fontSize: 18 }}>⋮</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Brightness/Volume sliders */}
      {controlsVisible && !isLocked && (
        <View style={[styles.sliderContainer, { left: spacing.md }]}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>☀️</Text>
          <View style={styles.verticalTrack}>
            <View style={[styles.verticalProgress, { height: `${brightness * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}
      {controlsVisible && !isLocked && (
        <View style={[styles.sliderContainer, { right: spacing.md }]}>
          <Pressable onPress={toggleMute}>
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{isMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
          <View style={styles.verticalTrack}>
            <View style={[styles.verticalProgress, { height: `${(isMuted ? 0 : localVolume) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {/* Center playback controls */}
      {controlsVisible && !isLocked && (
        <Animated.View style={[styles.centerControls, { opacity: fadeAnimRef.current }]}>
          <Pressable onPress={() => { triggerHaptic('light'); previous(); }} style={styles.playbackSideButton} accessibilityLabel="Previous" accessibilityRole="button">
            <Text style={{ color: '#fff', fontSize: 18 }}>⏮</Text>
          </Pressable>
          <Pressable onPress={() => { triggerHaptic('light'); handleSkip(-skipAmount); }} style={styles.playbackSideButton} accessibilityLabel={`Rewind ${skipAmount} seconds`} accessibilityRole="button">
            <Text style={{ color: '#fff', fontSize: 16 }}>⟲{skipAmount}</Text>
          </Pressable>
          <Pressable onPress={() => { triggerHaptic('medium'); togglePlay(); }} style={styles.playButton} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} accessibilityRole="button">
            <Text style={{ color: '#fff', fontSize: 28, marginLeft: isPlaying ? 0 : 4 }}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable onPress={() => { triggerHaptic('light'); handleSkip(skipAmount); }} style={styles.playbackSideButton} accessibilityLabel={`Fast forward ${skipAmount} seconds`} accessibilityRole="button">
            <Text style={{ color: '#fff', fontSize: 16 }}>{skipAmount}⟳</Text>
          </Pressable>
          <Pressable onPress={() => { triggerHaptic('light'); next(); }} style={styles.playbackSideButton} accessibilityLabel="Next" accessibilityRole="button">
            <Text style={{ color: '#fff', fontSize: 18 }}>⏭</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Lock button */}
      <Pressable
        onPress={() => { triggerHaptic('light'); setIsLocked(!isLocked); }}
        style={{ position: 'absolute', bottom: isLocked ? spacing.xl : spacing['3xl'] + 50, left: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
        accessibilityLabel={isLocked ? 'Unlock controls' : 'Lock controls'}
        accessibilityRole="button"
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>{isLocked ? '🔒' : '🔓'}</Text>
      </Pressable>

      {/* Bottom bar */}
      {controlsVisible && !isLocked && (
        <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', paddingTop: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, opacity: fadeAnimRef.current }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(position)}</Text>
            <Pressable
              style={{ flex: 1, height: 4, backgroundColor: '#333', borderRadius: borderRadius.full, position: 'relative' }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                const ratio = e.nativeEvent.locationX / (W - spacing.md * 2);
                seekTo(Math.min(ratio, 1) * duration);
              }}
            >
              <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: borderRadius.full }} />
              <View style={{ position: 'absolute', top: -4, left: `${progress * 100}%`, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginLeft: -6 }} />
            </Pressable>
            <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(duration)}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <Pressable onPress={handleSpeedCycle}>
              <Text style={styles.toolbarLabel}>{longPressSpeed ? '2.00' : playbackSpeed.toFixed(2)}x</Text>
            </Pressable>
            <Pressable onPress={() => { triggerHaptic('light'); addBookmark(); }} style={styles.toolbarButton}>
              <Text style={{ fontSize: 18, color: '#fff' }}>🔖</Text>
              <Text style={styles.toolbarSubLabel}>Bookmark</Text>
            </Pressable>
            <Pressable onPress={() => { triggerHaptic('light'); setMoreSheet(moreSheet === 'bookmarks' ? 'none' : 'bookmarks'); }} style={styles.toolbarButton}>
              <Text style={{ fontSize: 18, color: '#fff' }}>📑</Text>
              <Text style={styles.toolbarSubLabel}>{videoBookmarks.length > 0 ? `(${videoBookmarks.length})` : 'Saved'}</Text>
            </Pressable>
            <Pressable onPress={() => { triggerHaptic('light'); setMoreSheet(moreSheet === 'audio' ? 'none' : 'audio'); }} style={styles.toolbarButton}>
              <Text style={{ fontSize: 18, color: '#fff' }}>🎚</Text>
              <Text style={styles.toolbarSubLabel}>Audio</Text>
            </Pressable>
            <Pressable onPress={() => { triggerHaptic('light'); setMoreSheet(moreSheet === 'video' ? 'none' : 'video'); }} style={styles.toolbarButton}>
              <Text style={{ fontSize: 18, color: '#fff' }}>🎬</Text>
              <Text style={styles.toolbarSubLabel}>Video</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Audio Track Selection + Equalizer Overlay */}
      {moreSheet === 'audio' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Audio</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 200 }}>
            {audioTracks.length > 0 && (
              <>
                <Text style={{ color: '#999', fontSize: 12, marginBottom: spacing.xs }}>Audio Track</Text>
                {audioTracks.map((track, idx) => (
                  <Pressable
                    key={`audio-${idx}`}
                    onPress={() => { setSelectedAudioTrack(idx); triggerHaptic('light'); }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <Text style={{ color: selectedAudioTrack === idx ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedAudioTrack === idx ? '700' : '400' }}>
                      {track.title || track.language || `Track ${idx + 1}`}
                    </Text>
                    {selectedAudioTrack === idx && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
          <AudioEqualizer onClose={() => setMoreSheet('none')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Audio-Only Mode</Text>
            <Pressable onPress={() => setAudioOnly(!isAudioOnly)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: isAudioOnly ? colors.primary : 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{isAudioOnly ? 'On' : 'Off'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Subtitle Studio */}
      {moreSheet === 'subtitlestudio' && (
        <View style={styles.overlay}>
          <SubtitleStudio onClose={() => setMoreSheet('none')} />
        </View>
      )}

      {/* Subtitle Track + Video Enhancements Overlay */}
      {moreSheet === 'video' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Subtitles & Video</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 180 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ color: '#999', fontSize: 12 }}>Subtitles</Text>
              <Pressable onPress={() => setMoreSheet('subtitlestudio')}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>Style →</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => { setSelectedTextTrack(-1); triggerHaptic('light'); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
            >
              <Text style={{ color: selectedTextTrack === -1 ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedTextTrack === -1 ? '700' : '400' }}>Off</Text>
              {selectedTextTrack === -1 && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
            </Pressable>
            {textTracks.map((track, idx) => (
              <Pressable
                key={`sub-${idx}`}
                onPress={() => { setSelectedTextTrack(idx); triggerHaptic('light'); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
              >
                <Text style={{ color: selectedTextTrack === idx ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedTextTrack === idx ? '700' : '400' }}>
                  {track.title || track.language || `Track ${idx + 1}`}
                </Text>
                {selectedTextTrack === idx && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
              </Pressable>
            ))}
            {video?.subtitles && video.subtitles.length > 0 && (
              <>
                <Text style={{ color: '#999', fontSize: 12, marginTop: spacing.sm, marginBottom: spacing.xs }}>External Subtitles</Text>
                {video.subtitles.map((sub: { language: string; name: string }, idx: number) => (
                  <View key={`ext-sub-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
                    <Text style={{ color: '#fff', fontSize: 13 }}>{sub.language} ({sub.name})</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm, paddingTop: spacing.sm }}>
            <VideoEnhancements
              currentZoom={resizeMode}
              onZoomChange={setResizeMode}
              onClose={() => setMoreSheet('none')}
            />
          </View>
        </View>
      )}

      {/* Metadata Overlay */}
      {moreSheet === 'metadata' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Media Info</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            <MetaRow label="Resolution" value={metadata ? `${metadata.width}x${metadata.height}` : '—'} />
            <MetaRow label="Codec" value={metadata?.codec || '—'} />
            <MetaRow label="Bitrate" value={metadata?.bitrate ? `${(metadata.bitrate / 1000).toFixed(0)} kbps` : '—'} />
            <MetaRow label="Frame Rate" value={metadata?.frameRate ? `${metadata.frameRate.toFixed(2)} fps` : '—'} />
            <MetaRow label="Aspect Ratio" value={metadata?.displayAspectRatio || '—'} />
            <MetaRow label="HDR" value={metadata?.isHDR ? 'Yes' : 'No'} />
            <MetaRow label="Audio Codec" value={metadata?.audioCodec || '—'} />
            <MetaRow label="Audio Channels" value={metadata?.audioChannels ? `${metadata.audioChannels}` : '—'} />
            <MetaRow label="Sample Rate" value={metadata?.audioSampleRate ? `${metadata.audioSampleRate} Hz` : '—'} />
            <MetaRow label="File Size" value={video ? `${(video.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB` : '—'} />
            <MetaRow label="File Path" value={video?.file.path || '—'} />
          </ScrollView>
        </View>
      )}

      {/* Sleep Timer */}
      {moreSheet === 'sleeptimer' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sleep Timer</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          {sleepTimer?.isActive ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <Text style={{ color: '#fff', fontSize: 14, marginBottom: spacing.sm }}>
                Timer active — {Math.floor(sleepTimer.remainingSeconds / 60)}:{String(sleepTimer.remainingSeconds % 60).padStart(2, '0')} remaining
              </Text>
              <Pressable onPress={cancelSleepTimer} style={{ backgroundColor: colors.error, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Cancel Timer</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm }}>
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <Pressable key={mins} onPress={() => { startSleepTimer(mins); setMoreSheet('none'); triggerHaptic('medium'); }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>{mins < 60 ? `${mins} min` : `${mins / 60} hr`}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Bookmarks */}
      {moreSheet === 'bookmarks' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Bookmarks ({videoBookmarks.length})</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 250 }}>
            {videoBookmarks.length === 0 ? (
              <Text style={{ color: '#666', fontSize: 13, paddingVertical: spacing.md, textAlign: 'center' }}>No bookmarks yet.</Text>
            ) : (
              [...videoBookmarks].sort((a, b) => a.timestamp - b.timestamp).map((bm) => (
                <View key={bm.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                  <Pressable onPress={() => seekTo(bm.timestamp)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{formatDuration(bm.timestamp)}</Text>
                    <Text style={{ color: '#ccc', fontSize: 13 }} numberOfLines={1}>{bm.label}</Text>
                  </Pressable>
                  <Pressable onPress={() => { removeBookmark(bm.id); triggerHaptic('light'); }} hitSlop={8} style={{ padding: spacing.xs }}>
                    <Text style={{ color: '#666', fontSize: 14 }}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Tools */}
      {moreSheet === 'tools' && (
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Tools</Text>
            <Pressable onPress={() => setMoreSheet('none')}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm }}>
            <ToolButton icon="🔖" label="Bookmark" onPress={() => { addBookmark(); triggerHaptic('light'); }} />
            <ToolButton icon="📑" label="Saved" onPress={() => setMoreSheet('bookmarks')} />
            <ToolButton icon="📸" label="Capture" onPress={handleScreenshot} />
            <ToolButton icon="🖼" label="Thumbnail" onPress={handleExtractThumbnail} />
            <ToolButton icon="⏱" label="Timer" onPress={() => setMoreSheet('sleeptimer')} />
            <ToolButton icon="ⓘ" label="Info" onPress={() => setMoreSheet('metadata')} />
            <ToolButton icon="🎚" label="Audio" onPress={() => setMoreSheet('audio')} />
            <ToolButton icon="🎬" label="Video" onPress={() => setMoreSheet('video')} />
            <ToolButton icon="💬" label="Subtitles" onPress={() => setMoreSheet('subtitlestudio')} />
            <ToolButton icon="🖼" label="PiP" onPress={handlePiP} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Background Playback</Text>
            <Pressable onPress={() => setBackgroundPlayback(!backgroundPlayback)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: backgroundPlayback ? colors.primary : 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{backgroundPlayback ? 'On' : 'Off'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ color: '#999', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ToolButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', width: 72, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }}>
      <Text style={{ fontSize: 22, marginBottom: 2 }}>{icon}</Text>
      <Text style={{ color: '#ccc', fontSize: 10 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  sliderContainer: { position: 'absolute', top: '30%', alignItems: 'center', width: 32, zIndex: 10 },
  verticalTrack: { width: 4, height: 120, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-end' },
  verticalProgress: { width: '100%', borderRadius: 2 },
  centerControls: { position: 'absolute', top: '45%', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 },
  playbackSideButton: { width: 44, height: 40, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  toolbarButton: { alignItems: 'center' },
  toolbarLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  toolbarSubLabel: { color: '#999', fontSize: 10, marginTop: 4 },
  centerBadge: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  centerBadgeText: { color: '#fff', fontSize: 18, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,2