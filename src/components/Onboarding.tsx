import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { useTheme } from '@/theme';
import { H1, Label, Press, Txt } from './ui';

export function Dots({ step }: { step: 1 | 2 | 3 }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLabel={`Step ${step} of 3`}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={{ height: 6, width: n === step ? 22 : 6, borderRadius: 3, backgroundColor: n === step ? t.ink : t.line }} />
      ))}
    </View>
  );
}

/** Finishes onboarding without adding anything. */
export function useSkip() {
  const complete = useStore((s) => s.completeOnboarding);
  return complete;
}

export function OnbFrame({ step, right, children, footer }: { step: 1 | 2 | 3; right?: ReactNode; children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const skip = useSkip();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
      <View style={{ height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Dots step={step} />
        {right ?? (
          <Press accessibilityRole="button" onPress={skip} style={{ paddingVertical: 12, paddingLeft: 12 }}>
            <Txt size={15} color={t.muted}>
              Skip
            </Txt>
          </Press>
        )}
      </View>
      {children}
      <View style={{ marginTop: 'auto', paddingBottom: Math.max(insets.bottom, 12) + 12, gap: 10 }}>{footer}</View>
    </View>
  );
}

export function OnbCopy({ eyebrow, title, body, style }: { eyebrow: string; title: string; body: string; style?: object }) {
  const t = useTheme();
  return (
    <View style={[{ marginTop: 30, gap: 12 }, style]}>
      <Label color={t.accent}>{eyebrow}</Label>
      <H1>{title}</H1>
      <Txt size={16} lh={1.5} color={t.muted}>
        {body}
      </Txt>
    </View>
  );
}
