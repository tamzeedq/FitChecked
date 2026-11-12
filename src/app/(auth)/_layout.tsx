import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

import { useTheme } from '@/theme';

export default function AuthLayout() {
  const t = useTheme();
  const signedIn = useAuth((s) => !!s.session);
  if (signedIn) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
