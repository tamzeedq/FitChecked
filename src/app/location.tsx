import { router } from 'expo-router';
import { View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { Press, Txt, Icon } from '@/components/ui';
import { useStore } from '@/data/store';
import { placeFromDevice } from '@/lib/weather';
import { GUTTER, useTheme } from '@/theme';

export default function LocationSettings() {
  const t = useTheme();
  const updateSettings = useStore((s) => s.updateSettings);

  const useDevice = async () => {
    const place = await placeFromDevice().catch(() => null);
    if (place) {
      updateSettings({ place, useDeviceLocation: true });
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <CityPicker
        backLabel="Profile"
        note="Used only for weather."
        onPick={(place) => {
          updateSettings({ place, useDeviceLocation: false });
          router.back();
        }}
      />
      <Press accessibilityRole="button" onPress={useDevice} style={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom: 40, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="near_me" size={20} color={t.accent} />
        <Txt size={15} weight={600} color={t.accent}>
          Use phone location
        </Txt>
      </Press>
    </View>
  );
}
