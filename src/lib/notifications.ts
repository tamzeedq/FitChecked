import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useStore } from '@/data/store';

const ID = 'morning-suggestion';

/** Keeps the daily "morning suggestion" reminder in sync with Settings. */
export function useMorningReminder() {
  const on = useStore((s) => s.settings.morningSuggestion);
  const time = useStore((s) => s.settings.morningTime);
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    if (Platform.OS === 'web' || !onboarded) return;
    (async () => {
      await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
      if (!on) return;
      const perm = await Notifications.getPermissionsAsync();
      const granted = perm.granted || (perm.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
      if (!granted) return;
      const [hour, minute] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: ID,
        content: { title: 'Today’s outfit is ready', body: 'A pick for today’s weather is waiting in FitChecked.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    })().catch(() => {});
  }, [on, time, onboarded]);
}
