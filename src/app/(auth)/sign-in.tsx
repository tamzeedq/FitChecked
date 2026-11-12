import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout, Field } from '@/components/AuthForm';
import { Button, Press, Txt } from '@/components/ui';
import { isValidEmail, useAuth } from '@/lib/auth';
import { useTheme } from '@/theme';

export default function SignIn() {
  const t = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setErrors({ form: error });
    // On success the root layout swaps to the signed-in stack.
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in" subtitle="Sign in to open your closet.">
      <Field label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
      <Field label="Password" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoComplete="current-password" textContentType="password" placeholder="Password" onSubmitEditing={submit} />
      {errors.form ? (
        <Txt size={14} color={t.danger} accessibilityRole="alert">
          {errors.form}
        </Txt>
      ) : null}
      <Button label={busy ? 'Signing in…' : 'Sign in'} disabled={busy} onPress={submit} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Link href="/forgot-password" asChild>
          <Press accessibilityRole="link" style={{ height: 44, justifyContent: 'center' }}>
            <Txt size={15} weight={600}>
              Forgot password?
            </Txt>
          </Press>
        </Link>
        <Press accessibilityRole="link" onPress={() => router.replace('/sign-up')} style={{ height: 44, justifyContent: 'center' }}>
          <Txt size={15} color={t.muted}>
            New here? <Txt size={15} weight={600}>Create an account</Txt>
          </Txt>
        </Press>
      </View>
    </AuthLayout>
  );
}
