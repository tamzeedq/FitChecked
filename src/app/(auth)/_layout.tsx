import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '@/lib/auth';

import { useTheme } from '@/theme';

export default function AuthLayout() {
  const t = useTheme();
  const signedIn = useAuth((s) => !!s.session);
  // The recovery link signs the user in, but they still need to set a new password.
  const resetting = (useSegments() as string[]).includes('reset-password');
  if (signedIn && !resetting) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />;
}
