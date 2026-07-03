import { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { usePlayer } from '../player';
import { usePerVideoSubtitleSettings } from '../storage';
import { getActiveCues } from './parser';
import type { SubtitleTrack } from './parser';

interface SubtitleOverlayProps {
  track?: SubtitleTrack;
  currentTime?: number;
}

export function SubtitleOverlay({ track, currentTime }: SubtitleOverlayProps) {
  const { position } = usePlayer();
  const { mergedSubtitleSettings: s } = usePerVideoSubtitleSettings();

  const time = currentTime ?? position;

  const activeCues = useMemo(() => {
    if (!track) return [];
    return getActiveCues(track.cues, time + s.subtitleOffset);
  }, [track, time, s.subtitleOffset]);

  if (activeCues.length === 0) return null;

  const subtitleTop = s.subtitlePosition === 'top' ? 100 : undefined;
  const subtitleBottom = s.subtitlePosition !== 'top' ? 80 : undefined;
  const subtitleJustify = s.subtitlePosition === 'middle' ? 'center' as const : undefined;

  const textShadow = s.subtitleShadow ? {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } : {};

  const outlineStyle = s.subtitleOutline ? {
    ...Platform.select({
      ios: {
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
      android: {
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
      default: {},
    }),
  } : {};

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
        paddingHorizontal: 24,
        top: subtitleTop,
        bottom: subtitleBottom,
        justifyContent: subtitleJustify,
      }}
      accessibilityRole="text"
      accessibilityLabel="Subtitle text"
    >
      {activeCues.map((cue) => (
        <Text
          key={cue.id}
          style={{
            color: s.subtitleFontColor,
            fontSize: s.subtitleFontSize,
            backgroundColor: s.subtitleBackgroundColor,
            fontFamily: s.subtitleFontFamily,
            textAlign: 'center',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 4,
            lineHeight: s.subtitleFontSize * 1.4,
            ...textShadow,
            ...outlineStyle,
          }}
        >
          {cue.text}
        </Text>
      ))}
    </View>
  );
}
