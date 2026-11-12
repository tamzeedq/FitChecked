import { type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Scroll, Screen } from '@/components/Chrome';
import { H1, Label, Txt } from '@/components/ui';
import { radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';

export function Field({ label, error, ...rest }: TextInputProps & { label: string; error?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ height: 50, borderRadius: radius.button, borderWidth: 1, borderColor: error ? t.danger : t.inBd, backgroundColor: t.inBg, paddingHorizontal: 14, fontSize: 16, fontFamily: family[600], color: t.ink }}
        {...rest}
      />
      {error ? (
        <Txt size={13} color={t.danger} accessibilityRole="alert">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

export function AuthLayout({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <Screen>
      <Scroll gap={16} contentStyle={{ paddingTop: 32, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 4 }}>
          <Label>{eyebrow}</Label>
          <H1>{title}</H1>
          {subtitle ? (
            <Txt size={15} lh={1.45} color={t.muted} style={{ marginTop: 4 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {children}
      </Scroll>
    </Screen>
  );
}
