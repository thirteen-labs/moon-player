import { View, Text } from 'react-native';

interface PlayerBadgesProps {
  longPressSpeed: boolean;
  skipIndicator: number | null;
  isAudioOnly: boolean;
}

export function PlayerBadges({ longPressSpeed, skipIndicator, isAudioOnly }: PlayerBadgesProps) {
  return (
    <>
      {isAudioOnly && (
        <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 25 }}>
          <Text style={{ fontSize: 64 }}>🎵</Text>
          <Text style={{ color: '#fff', fontSize: 16, marginTop: 8, fontWeight: '600' }}>Audio Only Mode</Text>
        </View>
      )}
      {longPressSpeed && (
        <View style={styles.centerBadge}><Text style={styles.centerBadgeText}>2x SPEED</Text></View>
      )}
      {skipIndicator !== null && (
        <View style={styles.centerBadge}>
          <Text style={styles.centerBadgeText}>{skipIndicator > 0 ? `+${skipIndicator}s` : `${skipIndicator}s`}</Text>
        </View>
      )}
    </>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  centerBadge: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  centerBadgeText: { color: '#fff', fontSize: 18, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },
});
