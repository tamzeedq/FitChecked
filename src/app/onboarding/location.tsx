import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { OnbCopy, OnbFrame } from '@/components/Onboarding';
import { Button, Icon, Txt } from '@/components/ui';
import { useStore } from '@/data/store';
import { placeFromDevice } from '@/lib/weather';
import { radius, useTheme } from '@/theme';

export default function LocationPriming() {
  const t = useTheme();
  const updateSettings = useStore((s) => s.updateSettings);
  const [busy, setBusy] = useState(false);

  const allow = async () => {
    setBusy(true);
    try {
      const place = await placeFromDevice();
      if (place) {
        updateSettings({ place, useDeviceLocation: true });
        router.push('/onboarding/first-items');
      } else {
        // Denied: fall back to entering a city.
        router.push('/onboarding/city');
      }
    } catch {
      router.push('/onboarding/city');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnbFrame
      step={2}
      footer={
        <>
          <Button label={busy ? 'Finding you…' : 'Allow location'} icon="near_me" onPress={allow} disabled={busy} />
          <Button label="Enter my city instead" kind="secondary" onPress={() => router.push('/onboarding/city')} />
        </>
      }
    >
      <View style={{ height: 300, marginTop: 10, borderRadius: radius.card, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Icon name="rainy" size={110} color={t.accent} />
        <View style={{ height: 40, paddingHorizontal: 16, borderRadius: radius.chip, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="location_on" size={18} />
          <Txt size={15} weight={600}>
            Weather near you
          </Txt>
        </View>
      </View>
      <OnbCopy
        eyebrow="Step 2 of 3 · Weather"
        title="Dress for the weather outside your door"
        body="FitChecked uses your location only to fetch local weather for suggestions. It stays on this phone."
      />
    </OnbFrame>
  );
}
