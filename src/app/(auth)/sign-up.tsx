import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout, Field } from '@/components/AuthForm';
import { Button, Press, Txt } from '@/components/ui';
import { isValidEmail, MIN_PASSWORD, useAuth } from '@/lib/auth';
import { useTheme } from '@/theme';

export default function SignUp() {
  const t = useTheme();
  const signUp = useAuth((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const res = await signUp(email, password);
    setBusy(false);
    if (res.error) setErrors({ form: res.error });
    else if (res.needsConfirmation) setSent(true);
    // Otherwise a session exists and the root layout swaps to the signed-in stack.
  };

  if (sent) {
    return (
      <AuthLayout eyebrow="Almost there" title="Check your email" subtitle={`We sent a confirmation link to ${email.trim()}. Open it, then sign in.`}>
        <Button label="Back to sign in" onPress={() => router.replace('/sign-in')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Get started" title="Create account" subtitle="One account keeps your closet safe.">
      <Field label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
      <Field label="Password" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder={`At least ${MIN_PASSWORD} characters`} />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} error={errors.confirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Repeat password" onSubmitEditing={submit} />
      {errors.form ? (
        <Txt size={14} color={t.danger} accessibilityRole="alert">
          {errors.form}
        </Txt>
      ) : null}
      <Button label={busy ? 'Creating…' : 'Create account'} disabled={busy} onPress={submit} />
      <View style={{ alignItems: 'center' }}>
        <Press accessibilityRole="link" onPress={() => router.replace('/sign-in')} style={{ height: 44, justifyContent: 'center' }}>
          <Txt size={15} color={t.muted}>
            Have an account? <Txt size={15} weight={600}>Sign in</Txt>
          </Txt>
        </Press>
      </View>
    </AuthLayout>
  );
}
