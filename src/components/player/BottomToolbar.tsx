import { View, Text, Pressable } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface BottomToolbarProps {
  playbackSpeed: number;
  longPressSpeed: boolean;
  videoBookmarks: { id: string }[];
  onSpeedCycle: () => void;
  onAddBookmark: () => void;
  onToggleSheet: (sheet: string | 'none' | 'audio' | 'video' | 'bookmarks') => void;
  currentSheet: string;
}

export function BottomToolbar({ playbackSpeed, longPressSpeed, videoBookmarks, onSpeedCycle, onAddBookmark, onToggleSheet, currentSheet }: BottomToolbarProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
      <Pressable onPress={onSpeedCycle}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{longPressSpeed ? '2.00' : playbackSpeed.toFixed(2)}x</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onAddBookmark(); }} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#fff' }}>🔖</Text>
        <Text style={{ color: '#999', fontSize: 10, marginTop: 4 }}>Bookmark</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onToggleSheet(currentSheet === 'bookmarks' ? 'none' : 'bookmarks'); }} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#fff' }}>📑</Text>
        <Text style={{ color: '#999', fontSize: 10, marginTop: 4 }}>{videoBookmarks.length > 0 ? `(${videoBookmarks.length})` : 'Saved'}</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onToggleSheet(currentSheet === 'audio' ? 'none' : 'audio'); }} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#fff' }}>🎚</Text>
        <Text style={{ color: '#999', fontSize: 10, marginTop: 4 }}>Audio</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onToggleSheet(currentSheet === 'video' ? 'none' : 'video'); }} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#fff' }}>🎬</Text>
        <Text style={{ color: '#999', fontSize: 10, marginTop: 4 }}>Video</Text>
      </Pressable>
    </View>
  );
}
