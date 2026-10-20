import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Place } from '@/data/types';
import { useCitySearch } from '@/lib/weather';
import { GUTTER, radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';
import { BackBar } from './Chrome';
import { H2, Icon, Label, Press, Txt } from './ui';

/** "Your city" screen, shared by onboarding and Profile → Location. */
export function CityPicker({ onPick, backLabel = 'Your city', note }: { onPick: (p: Place) => void; backLabel?: string; note: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const { results, error } = useCitySearch(q);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: GUTTER - 10 }}>
        <BackBar label={backLabel} />
      </View>
      <View style={{ paddingHorizontal: GUTTER }}>
        <H2 style={{ marginTop: 8, marginBottom: 16 }}>Where should we check the weather?</H2>
        <View style={{ height: 50, borderRadius: radius.button, backgroundColor: t.inBg, borderWidth: 1, borderColor: t.inBd, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
          <Icon name="search" size={22} color={t.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="City name"
            placeholderTextColor={t.muted}
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 16, fontFamily: family[500], color: t.ink, height: '100%' }}
          />
          {q ? (
            <Press accessibilityLabel="Clear" onPress={() => setQ('')} hitSlop={10}>
              <Icon name="cancel" size={20} color={t.muted} />
            </Press>
          ) : null}
        </View>
        {results.length ? <Label style={{ marginTop: 22, marginBottom: 4 }}>Results</Label> : null}
        {results.map((c) => (
          <Press key={`${c.latitude},${c.longitude}`} onPress={() => onPick(c)} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: t.line }}>
            <Icon name="location_on" size={22} color={t.muted} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={16} weight={600}>
                {c.name}
              </Txt>
              <Txt size={13} color={t.muted}>
                {c.region}
              </Txt>
            </View>
          </Press>
        ))}
        {error ? (
          <Txt size={13} color={t.muted} style={{ marginTop: 18 }}>
            Can’t search right now. Check your connection and try again.
          </Txt>
        ) : null}
        <Txt size={13} lh={1.45} color={t.muted} style={{ marginTop: 18 }}>
          {note}
        </Txt>
      </View>
    </View>
  );
}
