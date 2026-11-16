import { Redirect, Stack } from 'expo-router';

import { useStore } from '@/data/store';
import { useAuth } from '@/lib/auth';

import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const t = useTheme();
  const signedIn = useAuth((s) => !!s.session);
  const onboarded = useStore((s) => s.onboarded);
  if (!signedIn) return <Redirect href="/sign-in" />;
  if (onboarded) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
