import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout, Field } from '@/components/AuthForm';
import { Button, Press, Txt } from '@/components/ui';
import { isValidEmail, useAuth } from '@/lib/auth';
import { useTheme } from '@/theme';

export default function ForgotPassword() {
  const t = useTheme();
  const resetPassword = useAuth((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setError(undefined);
    setBusy(true);
    const res = await resetPassword(email);
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  };

  return (
    <AuthLayout
      eyebrow="Account help"
      title="Reset password"
      subtitle={sent ? `If an account exists for ${email.trim()}, a reset link is on its way.` : "Enter your email and we'll send you a link to reset your password."}
    >
      {sent ? null : (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} error={error} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" onSubmitEditing={submit} />
          <Button label={busy ? 'Sending…' : 'Send reset link'} disabled={busy} onPress={submit} />
        </>
      )}
      <View style={{ alignItems: 'center' }}>
        <Press accessibilityRole="link" onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} style={{ height: 44, justifyContent: 'center' }}>
          <Txt size={15} weight={600} color={t.ink}>
            Back to sign in
          </Txt>
        </Press>
      </View>
    </AuthLayout>
  );
}
