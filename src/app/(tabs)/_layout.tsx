import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../components/BottomTabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={() => <BottomTabBar />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
