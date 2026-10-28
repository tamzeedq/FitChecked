import { Tabs } from 'expo-router';

import { TabBar } from '@/components/Chrome';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.bg } }}
      tabBar={({ state, navigateToTab }) => <TabBar active={state.index} onSelect={(i) => navigateToTab(state.routes[i].key)} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="closet" />
      <Tabs.Screen name="outfits" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
