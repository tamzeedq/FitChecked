import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Footer, ModalBar, Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { Button, Card, H1, Icon, Label, Press, Txt } from '@/components/ui';
import { itemMap, outfitItems, useOutfits, useStore } from '@/data/store';
import { fromKey, longDate, shortDate, todayKey } from '@/lib/dates';
import { usePicks } from '@/lib/usePicks';
import { GUTTER, radius, useTheme } from '@/theme';

export default function LogToday() {
  const t = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? todayKey();
  const isToday = day === todayKey();
  const outfits = useOutfits();
  const items = itemMap(useStore((s) => s.items));
  const logOutfits = useStore((s) => s.logOutfits);
  const { picks } = usePicks();
  const suggested = isToday ? picks[0]?.outfit.id : undefined;

  // Suggested pick first, then most recently worn.
  const list = useMemo(() => {
    const rest = [...outfits].filter((o) => o.id !== suggested).sort((a, b) => (b.lastWorn ?? '').localeCompare(a.lastWorn ?? ''));
    const s = outfits.find((o) => o.id === suggested);
    return s ? [s, ...rest] : rest;
  }, [outfits, suggested]);

  const [sel, setSel] = useState<string | undefined>(suggested ?? list[0]?.id);

  const done = () => {
    if (!sel) return;
    logOutfits(day, [sel]);
    router.back();
    router.navigate({ pathname: '/calendar', params: { day, week: '1' } });
  };

  return (
    <Screen>
      <ModalBar title={isToday ? 'Log today' : 'Log outfit'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 20, gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Label>{longDate(fromKey(day))}</Label>
          <H1>What did you wear?</H1>
        </View>
        {list.map((o) => {
          const on = sel === o.id;
          return (
            <Card key={o.id} onPress={() => setSel(o.id)} style={{ paddingVertical: 10, paddingLeft: 10, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: on ? t.accent : 'transparent' }}>
              <MiniCollage items={outfitItems(o, items)} size={58} />
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Txt size={15.5} weight={600} numberOfLines={1}>
                  {o.name}
                </Txt>
                <Txt size={12.5} color={t.muted}>
                  {o.id === suggested ? 'Suggested for today' : o.lastWorn ? `Last worn ${shortDate(o.lastWorn)}` : 'Not worn yet'}
                </Txt>
              </View>
              <Icon name={on ? 'radio_button_checked' : 'radio_button_unchecked'} size={24} color={on ? t.accent : t.muted} />
            </Card>
          );
        })}
        <Press
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/pick', params: { mode: 'log', day } })}
          style={{ minHeight: 56, borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.muted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icon name="add" size={20} color={t.muted} />
          <Txt size={15} weight={600} color={t.muted}>
            Pick individual pieces
          </Txt>
        </Press>
      </ScrollView>
      <Footer>
        <Button label="Log outfit" icon="event_available" disabled={!sel} onPress={done} />
      </Footer>
    </Screen>
  );
}
