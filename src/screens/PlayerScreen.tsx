import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import Video, { SelectedTrackType } from 'react-native-video';
import { Gesture } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { usePlayer } from '../player';
import { useLibrary } from '../library';
import { useSettings } from '../storage';
import { SubtitleOverlay } from '../subtitles/SubtitleOverlay';
import { Toast } from '../components/Toast';
import { TransportControls } from '../components/player/TransportControls';
import { SeekBar } from '../components/player/SeekBar';
import { PlayerHeader } from '../components/player/PlayerHeader';
import { SideControls } from '../components/player/SideControls';
import { BottomToolbar } from '../components/player/BottomToolbar';
import { LockButton } from '../components/player/LockButton';
import { PlayerBadges } from '../components/player/PlayerBadges';
import { GestureOverlay } from '../components/player/GestureOverlay';
import { AudioOverlay } from '../components/player/AudioOverlay';
import { SubtitleVideoOverlay } from '../components/player/SubtitleVideoOverlay';
import { MetadataPanel } from '../components/player/MetadataPanel';
import { ToolsPanel } from '../components/player/ToolsPanel';

const { width: W, height: H } = Dimensions.get('window');

type MoreSheet = 'none' | 'tools' | 'metadata' | 'audio' | 'video';

export function PlayerScreen({ routeUri }: { routeUri?: string }) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const { settings } = useSettings();

  const {
    currentVideo, isPlaying, position, duration, playbackSpeed,
    volume, isMuted, videoRef, playVideo, togglePlay, seekTo,
    setPlaybackSpeed, setVolume, toggleMute, next, previous,
    onProgress, onLoad, onEnd, onError,
    isAudioOnly, setAudioOnly,
    audioTracks, selectedAudioTrack, setSelectedAudioTrack,
    textTracks, selectedTextTrack, setSelectedTextTrack,
    enterPiP, exitPiP, isPiPActive,
    isBackgroundAudioEnabled, toggleBackgroundAudio,
  } = usePlayer();

  const { getVideo } = useLibrary();
  const video = currentVideo || (routeUri ? getVideo(routeUri) : undefined);

  useEffect(() => {
    if (routeUri && !currentVideo) {
      const found = getVideo(routeUri);
      if (found) playVideo(found);
    }
  }, [routeUri, currentVideo, playVideo, getVideo]);

  const [localVolume, setLocalVolume] = useState(volume);
  if (localVolume !== volume) setLocalVolume(volume);

  const [brightness, setBrightness] = useState(0.7);
  const [isLocked, setIsLocked] = useState(false);
  const [moreSheet, setMoreSheet] = useState<MoreSheet>('none');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
  const [longPressSpeed, setLongPressSpeed] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(1));
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isLocked && settings.autoHideControls) {
      hideTimerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          if (moreSheet === 'none') setControlsVisible(false);
        });
      }, settings.autoHideDelay);
    }
  }, [isLocked, settings.autoHideControls, settings.autoHideDelay, moreSheet, fadeAnim]);

  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

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

  /* eslint-disable react-hooks/refs */
  const panGesture = useMemo(() => Gesture.Pan()
    .minDistance(5)
    .onBegin((e) => {
      const x = e.x;
      if (x < W * 0.2) gestureZoneRef.current = 'brightness';
      else if (x > W * 0.8) gestureZoneRef.current = 'volume';
      else gestureZoneRef.current = 'seek';
      lastBrightnessRef.current = brightness;
      lastVolumeRef.current = localVolume;
    })
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
    .onEnd(() => { gestureZoneRef.current = null; }), [brightness, localVolume, isMuted, duration, position, settings, showControls, setVolume, toggleMute, seekTo]);
  /* eslint-enable react-hooks/refs */

  const effectiveVolume = isMuted ? 0 : Math.min(localVolume * (settings.volumeBoost || 1.0), 3.0);

  const handlePiP = useCallback(() => {
    if (isPiPActive) {
      exitPiP();
      showToast('Exited Picture in Picture');
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      enterPiP();
      showToast('Picture in Picture');
    } else {
      showToast('PiP not available');
    }
  }, [enterPiP, exitPiP, isPiPActive, showToast]);

  const skipAmount = settings.skipDuration || 10;

  /* eslint-disable react-hooks/refs */
  const doubleTapLeft = useMemo(() => Gesture.Tap().numberOfTaps(2).onEnd(() => { if (settings.gestureDoubleTap) { handleSkip(-skipAmount); showControls(); } }), [settings.gestureDoubleTap, handleSkip, skipAmount, showControls]);
  const singleTap = useMemo(() => Gesture.Tap().onEnd(() => showControls()), [showControls]);
  /* eslint-enable react-hooks/refs */
  const leftDoubleTap = useMemo(() => Gesture.Exclusive(doubleTapLeft, singleTap), [doubleTapLeft, singleTap]);

  const longPress = useMemo(() => Gesture.LongPress().minDuration(500).onStart(() => {
    if (settings.gestureLongPress) { setLongPressSpeed(true); setPlaybackSpeed(2.0); }
  }).onEnd(() => { setLongPressSpeed(false); }), [settings.gestureLongPress, setPlaybackSpeed]);

  const pinch = useMemo(() => Gesture.Pinch().onEnd((e) => {
    if (settings.gesturePinch) setResizeMode(e.scale > 1.15 ? 'cover' : 'contain');
  }), [settings.gesturePinch]);

  const composedGesture = useMemo(() => Gesture.Simultaneous(panGesture, leftDoubleTap, longPress, pinch), [panGesture, leftDoubleTap, longPress, pinch]);

  const videoSource = video?.file.uri
    ? video.file.uri.startsWith('http')
      ? { uri: video.file.uri, isNetwork: true }
      : { uri: video.file.uri }
    : undefined;

  const metadata = video?.metadata;

  const toggleSheet = useCallback((sheet: MoreSheet) => {
    setMoreSheet(sheet);
    showControls();
  }, [showControls]);

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
          playInBackground={isBackgroundAudioEnabled}
          playWhenInactive={isBackgroundAudioEnabled}
          preventsDisplaySleepDuringVideoPlayback
          selectedAudioTrack={{ type: SelectedTrackType.INDEX, value: selectedAudioTrack }}
          selectedTextTrack={selectedTextTrack >= 0 ? { type: SelectedTrackType.INDEX, value: selectedTextTrack } : undefined}
        />
      )}

      <SubtitleOverlay />
      <PlayerBadges longPressSpeed={longPressSpeed} skipIndicator={skipIndicator} isAudioOnly={isAudioOnly} />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <GestureOverlay composedGesture={composedGesture} />

      {controlsVisible && !isLocked && (
        <PlayerHeader videoTitle={videoTitle} videoYear={videoYear} moreSheet={moreSheet} onToggleSheet={toggleSheet as (sheet: string) => void} fadeAnim={fadeAnim} />
      )}

      {controlsVisible && !isLocked && (
        <SideControls brightness={brightness} volume={localVolume} isMuted={isMuted} onToggleMute={toggleMute} />
      )}

      {controlsVisible && !isLocked && (
        <TransportControls isPlaying={isPlaying} togglePlay={togglePlay} previous={previous} next={next} onSkip={handleSkip} skipAmount={skipAmount} />
      )}

      <LockButton isLocked={isLocked} onToggle={() => { setIsLocked(!isLocked); setControlsVisible(true); }} />

      {controlsVisible && !isLocked && (
        <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', paddingTop: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, opacity: fadeAnim }}>
          <SeekBar position={position} duration={duration} progress={progress} onSeek={seekTo} />
          <BottomToolbar playbackSpeed={playbackSpeed} longPressSpeed={longPressSpeed} onSpeedCycle={handleSpeedCycle} onToggleSheet={toggleSheet as (sheet: string) => void} currentSheet={moreSheet} />
        </Animated.View>
      )}

      {moreSheet === 'audio' && (
        <AudioOverlay audioTracks={audioTracks} selectedAudioTrack={selectedAudioTrack} isAudioOnly={isAudioOnly} onSelectTrack={setSelectedAudioTrack} onToggleAudioOnly={() => setAudioOnly(!isAudioOnly)} onClose={() => setMoreSheet('none')} />
      )}

      {moreSheet === 'video' && (
        <SubtitleVideoOverlay textTracks={textTracks} selectedTextTrack={selectedTextTrack} externalSubtitles={video?.subtitles} resizeMode={resizeMode} onSelectTextTrack={setSelectedTextTrack} onZoomChange={setResizeMode} onClose={() => setMoreSheet('none')} />
      )}

      {moreSheet === 'metadata' && (
        <MetadataPanel metadata={metadata || undefined} fileSize={video?.file.size} filePath={video?.file.path} onClose={() => setMoreSheet('none')} />
      )}

      {moreSheet === 'tools' && (
        <ToolsPanel onOpenInfo={() => setMoreSheet('metadata')} onOpenAudio={() => setMoreSheet('audio')} onOpenVideo={() => setMoreSheet('video')} onPiP={handlePiP} isBackgroundAudioEnabled={isBackgroundAudioEnabled} onToggleBackgroundAudio={toggleBackgroundAudio} onClose={() => setMoreSheet('none')} />
      )}
    </View>
  );
}
