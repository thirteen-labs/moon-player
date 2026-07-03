import { View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface GestureOverlayProps {
  composedGesture: ReturnType<typeof Gesture.Simultaneous>;
}

export function GestureOverlay({ composedGesture }: GestureOverlayProps) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <GestureDetector gesture={composedGesture}>
          <View style={{ flex: 1 }} />
        </GestureDetector>
      </View>
    </View>
  );
}
