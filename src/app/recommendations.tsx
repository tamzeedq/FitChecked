import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackBar, Scroll, Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { Button, Card, Chip, H1, H2, Icon, Press, Txt } from '@/components/ui';
import { cap, useStore } from '@/data/store';
import { todayKey } from '@/lib/dates';
import { OCCASIONS, type Occasion } from '@/lib/recommend';
import { usePicks } from '@/lib/usePicks';
import { formatTemp } from '@/lib/weather';
import { radius, useTheme } from '@/theme';

export default function Recommendations() {
  const t = useTheme();
  const [occ, setOcc] = useState<Occasion>('Casual');
  const { picks, weather, status } = usePicks(occ);
  const units = useStore((s) => s.settings.units);
  const skip = useStore((s) => s.settings.skipRecentDays);
  const log = useStore((s) => s.log);
  const logOutfits = useStore((s) => s.logOutfits);
  const unlogOutfit = useStore((s) => s.unlogOutfit);
  const dismissRec = useStore((s) => s.dismissRec);
  const resetDismissed = useStore((s) => s.resetDismissed);
  const tKey = todayKey();
  const dismissedRecs = useStore((s) => s.dismissedRecs);
  const dismissed = dismissedRecs.date === tKey ? dismissedRecs.ids : [];
  const top = picks.filter((p) => p.outfit.tags.includes(occ.toLowerCase())).slice(0, 3);

  return (
    <Screen tab={0}>
      <BackBar label="Today" />
      <Scroll gap={14}>
        <H1>Ideas for today</H1>
        <Card style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Icon name={weather?.icon ?? 'cloud_off'} size={40} color={t.accent} />
          <View style={{ gap: 2, flex: 1 }}>
            <Txt size={17} weight={700}>
              {weather ? `${formatTemp(weather.temp, units)} · ${weather.condition}` : status === 'loading' ? 'Checking weather…' : '– · Weather offline'}
            </Txt>
            <Txt size={13} color={t.muted}>
              {weather ? `High ${formatTemp(weather.high, units)} · Low ${formatTemp(weather.low, units)} · ${weather.outlook}` : 'Using season and recent wears for now'}
            </Txt>
          </View>
        </Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OCCASIONS.map((o) => (
            <Chip key={o} label={o} on={occ === o} onPress={() => setOcc(o)} />
          ))}
        </View>

        {top.map((r) => {
          const on = (log[tKey] ?? []).includes(r.outfit.id);
          return (
            <Card key={r.outfit.id} style={{ padding: 12, gap: 12 }}>
              <Press onPress={() => router.push(`/outfit/${r.outfit.id}`)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                <MiniCollage items={r.items} size={92} gap={3} />
                <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                  <H2>{r.outfit.name}</H2>
                  <Txt size={13} lh={1.4} color={t.muted}>
                    {r.why}
                  </Txt>
                  <Txt size={12} weight={600} color={t.accent} numberOfLines={1}>
                    {r.outfit.tags.map(cap).join(' · ')}
                  </Txt>
                </View>
              </Press>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Press
                  accessibilityRole="button"
                  onPress={() => (on ? unlogOutfit(tKey, r.outfit.id) : logOutfits(tKey, [r.outfit.id]))}
                  style={{ flex: 1, height: 44, borderRadius: radius.button, backgroundColor: on ? t.chipOnBg : t.btnBg, borderWidth: 1, borderColor: on ? t.chipOnBd : t.btnBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name={on ? 'check' : 'checkroom'} size={18} color={on ? t.chipOnInk : t.btnInk} />
                  <Txt size={14.5} weight={600} color={on ? t.chipOnInk : t.btnInk}>
                    {on ? 'Logged for today' : 'Wear this'}
                  </Txt>
                </Press>
                <Button kind="secondary" label="Not today" height={44} size={14.5} onPress={() => dismissRec(r.outfit.id)} />
              </View>
            </Card>
          );
        })}

        {!top.length ? (
          <Card style={{ paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', gap: 12 }}>
            <Txt size={14.5} lh={1.45} color={t.muted} style={{ textAlign: 'center' }}>
              {dismissed.length ? 'You skipped every idea for this occasion.' : `No outfits tagged ${occ.toLowerCase()} yet. Tag one in the outfit builder.`}
            </Txt>
            {dismissed.length ? <Button kind="secondary" label="Show them again" height={44} size={14.5} onPress={resetDismissed} /> : null}
          </Card>
        ) : null}
        <Txt size={12.5} color={t.muted} style={{ textAlign: 'center' }}>{`Skips anything worn in the last ${skip} days.`}</Txt>
      </Scroll>
    </Screen>
  );
}
