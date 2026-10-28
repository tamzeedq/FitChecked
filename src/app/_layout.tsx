import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { useMorningReminder } from '@/lib/notifications';
import { useTheme } from '@/theme';
import { fontAssets } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydrated() {
  const [done, setDone] = useState(useStore.persist.hasHydrated());
  useEffect(() => useStore.persist.onFinishHydration(() => setDone(true)), []);
  return done;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.onboarded);
  const t = useTheme();
  const ready = fontsLoaded && hydrated;

  useMorningReminder();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.bg).catch(() => {});
  }, [t.bg]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0b0b0b' } }} />
          <Stack.Screen name="processing" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="upload-failed" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="item/new" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="item/[id]/edit" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="builder" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="log" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="item/[id]/index" />
          <Stack.Screen name="outfit/[id]" />
          <Stack.Screen name="pick" />
          <Stack.Screen name="recommendations" />
          <Stack.Screen name="tags" />
          <Stack.Screen name="location" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
