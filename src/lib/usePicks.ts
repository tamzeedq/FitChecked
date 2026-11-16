import { useMemo } from 'react';

import { itemMap, useOutfits, useStore } from '@/data/store';
import { recommend, type Occasion } from './recommend';
import { todayKey } from './dates';
import { useWeather } from './weather';

/** Today's recommendations, optionally for one occasion. */
export function usePicks(occasion?: Occasion) {
  const items = useStore((s) => s.items);
  const outfits = useOutfits();
  const settings = useStore((s) => s.settings);
  const dismissed = useStore((s) => s.dismissedRecs);
  const wx = useWeather();

  const picks = useMemo(
    () =>
      recommend({
        outfits,
        items: itemMap(items),
        weather: wx.weather,
        units: settings.units,
        occasion,
        skipRecentDays: settings.skipRecentDays,
        exclude: dismissed.date === todayKey() ? dismissed.ids : [],
        latitude: settings.place?.latitude,
      }),
    [outfits, items, wx.weather, settings.units, settings.skipRecentDays, settings.place, occasion, dismissed],
  );
  return { picks, ...wx };
}
