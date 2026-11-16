import { Redirect, Tabs } from 'expo-router';

import { useStore } from '@/data/store';
import { useAuth } from '@/lib/auth';

import { TabBar } from '@/components/Chrome';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const signedIn = useAuth((s) => !!s.session);
  const onboarded = useStore((s) => s.onboarded);
  if (!signedIn) return <Redirect href="/sign-in" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
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
