import { router } from 'expo-router';

import { CityPicker } from '@/components/CityPicker';
import { useStore } from '@/data/store';

export default function EnterCity() {
  const updateSettings = useStore((s) => s.updateSettings);
  return (
    <CityPicker
      note="Used only for weather. You can switch to phone location later in Profile."
      onPick={(place) => {
        updateSettings({ place, useDeviceLocation: false });
        router.push('/onboarding/first-items');
      }}
    />
  );
}
