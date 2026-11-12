import { router } from 'expo-router';
import { View } from 'react-native';

import { Scroll, Screen } from '@/components/Chrome';
import { HeroCollage, MiniCollage } from '@/components/Collage';
import { EmptyTile, Garment } from '@/components/Garment';
import { Button, Card, H1, H2, Icon, Label, Press, Txt } from '@/components/ui';
import { itemMap, useStore } from '@/data/store';
import { addDays, dateKey, greeting, longDate, mondayIndex, todayKey } from '@/lib/dates';
import { shortWhy } from '@/lib/recommend';
import { usePicks } from '@/lib/usePicks';
import { formatTemp } from '@/lib/weather';
import { radius, useTheme } from '@/theme';

function WeekStrip() {
  const t = useTheme();
  const log = useStore((s) => s.log);
  const outfits = useStore((s) => s.outfits);
  const items = itemMap(useStore((s) => s.items));
  const today = new Date();
  const monday = addDays(today, -mondayIndex(today));
  const tKey = todayKey();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(monday, i);
        const key = dateKey(d);
        const sel = key === tKey;
        const future = key > tKey;
        const first = outfits.find((o) => o.id === log[key]?.[0]);
        const thumb = first ? items.get(first.itemIds[0]) : undefined;
        const ink = sel ? t.selInk : future ? t.muted : t.ink;
        return (
          <Press
            key={key}
            accessibilityLabel={longDate(d)}
            onPress={() => router.navigate({ pathname: '/calendar', params: { day: key } })}
            style={{ width: 46, alignItems: 'center', gap: 4, paddingTop: 6, paddingBottom: 7, borderRadius: radius.small, backgroundColor: sel ? t.selBg : 'transparent' }}
          >
            <Txt size={10.5} weight={600} color={ink} style={{ opacity: 0.75 }}>
              {'MTWTFSS'[i]}
            </Txt>
            <Txt size={14} weight={700} color={ink}>
              {d.getDate()}
            </Txt>
            {thumb ? (
              <View style={{ width: 26, height: 26 }}>
                <Garment item={thumb} r={radius.mini} mini />
              </View>
            ) : (
              <EmptyTile size={26} color={sel ? t.selInk : t.line} />
            )}
          </Press>
        );
      })}
    </View>
  );
}

export default function Home() {
  const t = useTheme();
  const name = useStore((s) => s.profileName);
  const units = useStore((s) => s.settings.units);
  const log = useStore((s) => s.log);
  const logOutfits = useStore((s) => s.logOutfits);
  const unlogOutfit = useStore((s) => s.unlogOutfit);
  const { picks, weather, status, retry, place } = usePicks();
  const offline = status === 'offline';

  const top = picks[0];
  const alts = offline ? [] : picks.slice(1, 3);
  const tKey = todayKey();
  const worn = top ? (log[tKey] ?? []).includes(top.outfit.id) : false;

  const chip = weather
    ? `${formatTemp(weather.temp, units)} ${weather.condition}${place ? ` · ${place.name}` : ''}`
    : status === 'loading'
      ? 'Checking weather…'
      : 'Weather offline' + (place ? ` · ${place.name}` : '');

  const quick = [
    { icon: 'add', l: 'Add item', go: () => router.push('/camera') },
    { icon: 'style', l: 'Build outfit', go: () => (useStore.getState().startDraft(), router.push('/builder')) },
    { icon: 'event_available', l: 'Log today', go: () => router.push('/log') },
  ];

  return (
    <Screen>
      <Scroll gap={14} contentStyle={{ paddingTop: 4 }}>
        <View style={{ height: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{longDate(new Date())}</Label>
          <View style={{ height: 36, paddingHorizontal: 12, borderRadius: radius.chip, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginLeft: 8 }}>
            <Icon name={weather?.icon ?? 'cloud_off'} size={18} color={t.accent} />
            <Txt size={13.5} weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>
              {chip}
            </Txt>
          </View>
        </View>
        <H1 style={{ marginTop: -6 }}>{name ? `${greeting()}, ${name}` : greeting()}</H1>

        {offline ? (
          <View style={{ height: 36, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: -6, paddingHorizontal: 12, borderRadius: radius.small, backgroundColor: t.surface2 }}>
            <Icon name="wifi_off" size={18} />
            <Txt size={13} style={{ flex: 1 }} numberOfLines={1}>
              {place ? 'Offline · showing your saved closet' : 'No location · set one in Profile'}
            </Txt>
            <Press accessibilityRole="button" onPress={place ? retry : () => router.push('/location')} hitSlop={10}>
              <Txt size={13} weight={700} color={t.accent}>
                {place ? 'Retry' : 'Set'}
              </Txt>
            </Press>
          </View>
        ) : null}

        <WeekStrip />

        {top ? (
          <Card style={{ padding: 12, gap: 12 }}>
            <Press onPress={() => router.push(`/outfit/${top.outfit.id}`)}>
              <HeroCollage items={top.items} height={176} />
            </Press>
            <View style={{ gap: 6, paddingHorizontal: 2 }}>
              <Label color={t.accent}>Recommended for today</Label>
              <H2>{top.outfit.name}</H2>
              <Txt size={13} lh={1.4} color={t.muted}>
                {top.reason}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                style={{ flex: 1 }}
                height={44}
                size={15}
                iconSize={19}
                icon={worn ? 'check' : 'checkroom'}
                label={worn ? 'Logged for today' : 'Wear this today'}
                onPress={() => (worn ? unlogOutfit(tKey, top.outfit.id) : logOutfits(tKey, [top.outfit.id]))}
              />
              <Press accessibilityRole="button" onPress={() => router.push('/recommendations')} style={{ height: 44, paddingHorizontal: 16, borderRadius: radius.button, backgroundColor: t.btn2Bg, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Txt size={15} weight={600} color={t.btn2Ink}>
                  More ideas
                </Txt>
                <Icon name="arrow_forward" size={18} color={t.btn2Ink} />
              </Press>
            </View>
          </Card>
        ) : (
          <Card style={{ padding: 20, gap: 10, alignItems: 'flex-start' }}>
            <Label color={t.accent}>Recommended for today</Label>
            <H2>Nothing to suggest yet</H2>
            <Txt size={14} lh={1.45} color={t.muted}>
              Add a few pieces and save an outfit. Suggestions use the weather and what you wore recently.
            </Txt>
          </Card>
        )}

        {alts.length ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {alts.map((a) => (
              <Card key={a.outfit.id} r={radius.small} onPress={() => router.push(`/outfit/${a.outfit.id}`)} style={{ flex: 1, padding: 8, flexDirection: 'row', gap: 10, alignItems: 'center', minWidth: 0 }}>
                <MiniCollage items={a.items} size={48} />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Txt size={13.5} weight={600} numberOfLines={1}>
                    {a.outfit.name}
                  </Txt>
                  <Txt size={11.5} color={t.muted} numberOfLines={1}>
                    {shortWhy(a)}
                  </Txt>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {quick.map((q) => (
            <Press key={q.l} accessibilityRole="button" onPress={q.go} style={{ flex: 1, height: 48, borderRadius: radius.button, backgroundColor: t.btn2Bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Icon name={q.icon} size={18} color={t.btn2Ink} />
              <Txt size={13} weight={600} color={t.btn2Ink} numberOfLines={1}>
                {q.l}
              </Txt>
            </Press>
          ))}
        </View>
      </Scroll>
    </Screen>
  );
}
