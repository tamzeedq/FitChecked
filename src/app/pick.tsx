import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BackBar, ChipStrip, Footer, Screen } from '@/components/Chrome';
import { Garment } from '@/components/Garment';
import { Button, Chip, H1, Icon, Press, Txt } from '@/components/ui';
import { useItems, useStore } from '@/data/store';
import { CATEGORIES } from '@/data/types';
import { todayKey } from '@/lib/dates';
import { GUTTER, useTheme } from '@/theme';

/** Choose pieces — for the outfit builder, or to log individual pieces for a day. */
export default function Pick() {
  const t = useTheme();
  const params = useLocalSearchParams<{ category?: string; mode?: 'log'; day?: string }>();
  const logMode = params.mode === 'log';
  const items = useItems();
  const draftIds = useStore((s) => s.draft.itemIds);
  const updateDraft = useStore((s) => s.updateDraft);
  const logPieces = useStore((s) => s.logPieces);

  const [filter, setFilter] = useState(params.category && (CATEGORIES as readonly string[]).includes(params.category) ? params.category : 'All');
  const [sel, setSel] = useState<string[]>(logMode ? [] : draftIds);

  const shown = items.filter((x) => filter === 'All' || x.category === filter);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const done = () => {
    if (logMode) {
      if (!sel.length) return;
      const day = params.day ?? todayKey();
      logPieces(day, sel);
      router.dismissAll();
      router.navigate({ pathname: '/calendar', params: { day, week: '1' } });
    } else {
      updateDraft({ itemIds: sel });
      router.back();
    }
  };

  return (
    <Screen>
      <BackBar label={logMode ? 'Log today' : 'New outfit'} />
      <View style={{ paddingHorizontal: GUTTER, gap: 14 }}>
        <H1>Choose pieces</H1>
        <ChipStrip>
          {['All', ...CATEGORIES].map((c) => (
            <Chip key={c} label={c} on={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ChipStrip>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 14 }}>
        {shown.length === 0 ? (
          <Txt size={14.5} color={t.muted} style={{ paddingVertical: 40, textAlign: 'center', width: '100%' }}>
            {items.length ? `No ${filter.toLowerCase()} yet.` : 'Your closet is empty. Add a few pieces first.'}
          </Txt>
        ) : null}
        {shown.map((x) => {
          const on = sel.includes(x.id);
          return (
            <Press key={x.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(x.id)} style={{ width: '31%', flexGrow: 1, maxWidth: '32%', gap: 6, minWidth: 0 }}>
              <View style={{ height: 104, borderRadius: 16, boxShadow: on ? `0px 0px 0px 2.5px ${t.accent}` : undefined }}>
                <Garment item={x} scale={0.78} mini />
                {on ? (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={17} color={t.onAccent} />
                  </View>
                ) : null}
              </View>
              <Txt size={12.5} weight={600} numberOfLines={1}>
                {x.name}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>
      <Footer style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Txt size={14} weight={600} style={{ flex: 1 }}>
          {`${sel.length} ${sel.length === 1 ? 'piece' : 'pieces'} selected`}
        </Txt>
        <Button label={logMode ? 'Log' : 'Done'} height={50} style={{ paddingHorizontal: 28 }} disabled={logMode && !sel.length} onPress={done} />
      </Footer>
    </Screen>
  );
}
