import { router } from 'expo-router';
import { useState } from 'react';

import { AuthLayout, Field } from '@/components/AuthForm';
import { Button, Press, Txt } from '@/components/ui';
import { MIN_PASSWORD, useAuth } from '@/lib/auth';
import { useTheme } from '@/theme';

export default function ResetPassword() {
  const t = useTheme();
  const hasSession = useAuth((s) => !!s.session);
  const initialized = useAuth((s) => s.initialized);
  const updatePassword = useAuth((s) => s.updatePassword);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    // The recovery session stays active, so on success the user is signed in with the new password.
    if (error) setErrors({ form: error });
    else router.replace('/');
  };

  // Recovery sessions are picked up asynchronously from the link; wait for that before judging it invalid.
  if (initialized && !hasSession) {
    return (
      <AuthLayout eyebrow="Account help" title="Link expired" subtitle="This reset link is invalid or has expired. Request a new one.">
        <Button label="Request a new link" onPress={() => router.replace('/forgot-password')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Account help" title="New password" subtitle="Choose a new password for your account.">
      <Field label="New password" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder={`At least ${MIN_PASSWORD} characters`} />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} error={errors.confirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Repeat password" onSubmitEditing={submit} />
      {errors.form ? (
        <Txt size={14} color={t.danger} accessibilityRole="alert">
          {errors.form}
        </Txt>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Set password'} disabled={busy} onPress={submit} />
      <Press accessibilityRole="link" onPress={() => router.replace('/sign-in')} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={15} color={t.muted}>
          Cancel
        </Txt>
      </Press>
    </AuthLayout>
  );
}
