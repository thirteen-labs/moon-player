import { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { usePlayer } from '../player';
import { useSettings } from '../storage';
import { getActiveCues } from './parser';
import type { SubtitleTrack } from './parser';

interface SubtitleOverlayProps {
  track?: SubtitleTrack;
  currentTime?: number;
}

export function SubtitleOverlay({ track, currentTime }: SubtitleOverlayProps) {
  const { settings } = useSettings();
  const { position } = usePlayer();

  const time = currentTime ?? position;

  const activeCues = useMemo(() => {
    if (!track) return [];
    return getActiveCues(track.cues, time + settings.subtitleOffset);
  }, [track, time, settings.subtitleOffset]);

  if (activeCues.length === 0) return null;

  const positionStyle: { bottom?: number; top?: number | string; justifyContent?: string } = {};
  if (settings.subtitlePosition === 'top') {
    positionStyle.top = 100;
  } else if (settings.subtitlePosition === 'middle') {
    positionStyle.top = '45%';
    positionStyle.justifyContent = 'center';
  } else {
    positionStyle.bottom = 80;
  }

  const textShadow = settings.subtitleShadow ? {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } : {};

  const outlineStyle = settings.subtitleOutline ? {
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
        ...positionStyle,
      }}
      accessibilityRole="text"
      accessibilityLabel="Subtitle text"
    >
      {activeCues.map((cue) => (
        <Text
          key={cue.id}
          style={{
            color: settings.subtitleFontColor,
            fontSize: settings.subtitleFontSize,
            backgroundColor: settings.subtitleBackgroundColor,
            fontFamily: settings.subtitleFontFamily,
            textAlign: 'center',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 4,
            lineHeight: settings.subtitleFontSize * 1.4,
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
