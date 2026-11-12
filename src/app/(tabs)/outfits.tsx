import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ChipStrip, Scroll, Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { Card, Chip, H1, Icon, IconButton, Label, Press, Txt } from '@/components/ui';
import { itemMap, outfitItems, useOutfits, useStore } from '@/data/store';
import { shortDate } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

const FILTERS = ['All', 'Casual', 'Work', 'Date night', 'Rain'];

export default function Outfits() {
  const t = useTheme();
  const outfits = useOutfits();
  const items = itemMap(useStore((s) => s.items));
  const [filter, setFilter] = useState('All');
  const [byWorn, setByWorn] = useState(false);

  const list = useMemo(() => {
    const f = filter.toLowerCase();
    const l = outfits.filter((o) => filter === 'All' || o.tags.includes(f));
    return [...l].sort((a, b) => (byWorn ? b.wearCount - a.wearCount : (b.lastWorn ?? '').localeCompare(a.lastWorn ?? '')));
  }, [outfits, filter, byWorn]);

  const newOutfit = () => {
    useStore.getState().startDraft();
    router.push('/builder');
  };

  return (
    <Screen>
      <Scroll gap={14} contentStyle={{ paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <Label>{`${outfits.length} ${outfits.length === 1 ? 'outfit' : 'outfits'}`}</Label>
            <H1>Outfits</H1>
          </View>
          <IconButton icon="add" label="New outfit" onPress={newOutfit} />
        </View>
        <ChipStrip>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ChipStrip>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Press accessibilityRole="button" onPress={() => setByWorn((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
            <Icon name="swap_vert" size={18} />
            <Txt size={13.5} weight={600}>
              {byWorn ? 'Most worn' : 'Recently worn'}
            </Txt>
          </Press>
          <Icon name="grid_view" size={20} color={t.muted} />
        </View>
        {list.length === 0 ? (
          <Txt size={14.5} color={t.muted} style={{ paddingVertical: 60, paddingHorizontal: 20, textAlign: 'center' }}>
            {outfits.length ? 'No outfits with this tag yet.' : 'No outfits yet. Tap + to build your first one.'}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {list.map((o) => (
              <Card key={o.id} onPress={() => router.push(`/outfit/${o.id}`)} style={{ flexBasis: '40%', flexGrow: 1, padding: 8, gap: 10, minWidth: 0 }}>
                <View style={{ height: 148 }}>
                  <MiniCollage items={outfitItems(o, items)} gap={4} r={radius.small} style={{ width: '100%', height: '100%', aspectRatio: undefined }} />
                </View>
                <View style={{ gap: 2, paddingHorizontal: 4, paddingBottom: 4 }}>
                  <Txt size={14.5} weight={600} numberOfLines={1}>
                    {o.name}
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    {`Worn ${o.wearCount}×${o.lastWorn ? ` · ${shortDate(o.lastWorn)}` : ''}`}
                  </Txt>
                </View>
              </Card>
            ))}
            {list.length % 2 ? <View style={{ flexBasis: '40%', flexGrow: 1 }} /> : null}
          </View>
        )}
      </Scroll>
    </Screen>
  );
}
