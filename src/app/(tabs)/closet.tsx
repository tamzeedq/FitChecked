import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ChipStrip, Scroll, Screen, Sheet } from '@/components/Chrome';
import { Garment } from '@/components/Garment';
import { UndoToast } from '@/components/UndoToast';
import { Button, Chip, H1, H2, Icon, IconButton, IconCircle, Label, Press, Txt } from '@/components/ui';
import { useItems } from '@/data/store';
import { CATEGORIES, COLORS, type ColorName } from '@/data/types';
import { radius, useTheme } from '@/theme';

const SORTS = [
  ['recent', 'Recently added'],
  ['worn', 'Most worn'],
  ['least', 'Least worn'],
] as const;
type Sort = (typeof SORTS)[number][0];

export default function Closet() {
  const t = useTheme();
  const all = useItems();
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState<Sort>('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [colors, setColors] = useState<ColorName[]>([]);
  const [favOnly, setFavOnly] = useState(false);

  const items = useMemo(() => {
    const list = all.filter((x) => (cat === 'All' || x.category === cat) && (!colors.length || colors.includes(x.color)) && (!favOnly || x.favorite));
    if (sort === 'recent') return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return [...list].sort((a, b) => (sort === 'worn' ? b.wearCount - a.wearCount : a.wearCount - b.wearCount));
  }, [all, cat, colors, favOnly, sort]);

  const filtersOn = colors.length + (favOnly ? 1 : 0);
  const cycleSort = () => setSort(SORTS[(SORTS.findIndex(([k]) => k === sort) + 1) % SORTS.length][0]);

  return (
    <Screen>
      <Scroll gap={14} contentStyle={{ paddingTop: 4, paddingBottom: 90, flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <Label>{`${all.length} ${all.length === 1 ? 'item' : 'items'}`}</Label>
            <H1>Closet</H1>
          </View>
          <IconButton icon="add" label="Add item" onPress={() => router.push('/camera')} />
        </View>

        <Press accessibilityRole="search" onPress={() => router.push('/search')} style={{ height: 46, borderRadius: radius.button, backgroundColor: t.inBg, borderWidth: 1, borderColor: t.inBd, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
          <Icon name="search" size={21} color={t.muted} />
          <Txt size={15} color={t.muted}>
            Search items, colors, tags
          </Txt>
        </Press>

        <ChipStrip>
          {['All', ...CATEGORIES].map((c) => (
            <Chip key={c} label={c} on={cat === c} onPress={() => setCat(c)} />
          ))}
        </ChipStrip>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Press accessibilityRole="button" onPress={cycleSort} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
            <Icon name="swap_vert" size={18} />
            <Txt size={13.5} weight={600}>
              {SORTS.find(([k]) => k === sort)![1]}
            </Txt>
          </Press>
          <Press accessibilityRole="button" onPress={() => setFilterOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
            <Icon name="tune" size={18} color={filtersOn ? t.accent : undefined} />
            <Txt size={13.5} weight={600} color={filtersOn ? t.accent : undefined}>
              {filtersOn ? `Filter · ${filtersOn}` : 'Filter'}
            </Txt>
          </Press>
        </View>

        {items.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 40 }}>
            <IconCircle name="checkroom" size={88} iconSize={44} />
            <H2 style={{ textAlign: 'center' }}>{all.length === 0 ? 'Your closet is empty' : cat === 'All' ? 'Nothing matches' : `No ${cat.toLowerCase()} yet`}</H2>
            <Txt size={14.5} lh={1.45} color={t.muted} style={{ textAlign: 'center' }}>
              Snap a plain photo of something you wear often. Name and category are all you need.
            </Txt>
            <Button label="Add an item" icon="photo_camera" height={48} size={15} iconSize={19} style={{ marginTop: 6, paddingHorizontal: 22 }} onPress={() => router.push('/camera')} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 14 }}>
            {items.map((x) => (
              <Press key={x.id} onPress={() => router.push(`/item/${x.id}`)} style={{ flexGrow: 1, flexBasis: '40%', gap: 8, minWidth: 0 }}>
                <View style={{ height: 150 }}>
                  <Garment item={x} />
                </View>
                <View style={{ gap: 2, paddingHorizontal: 2 }}>
                  <Txt size={14} weight={600} numberOfLines={1}>
                    {x.name}
                  </Txt>
                  <Txt size={12} color={t.muted}>
                    {`${x.category} · worn ${x.wearCount}×`}
                  </Txt>
                </View>
              </Press>
            ))}
            {items.length % 2 ? <View style={{ flexBasis: '40%', flexGrow: 1 }} /> : null}
          </View>
        )}
      </Scroll>
      <UndoToast />

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
          <H2>Filter</H2>
          <Press onPress={() => setFilterOpen(false)} style={{ height: 44, paddingLeft: 12, justifyContent: 'center' }}>
            <Txt size={16} weight={700} color={t.accent}>
              Done
            </Txt>
          </Press>
        </View>
        <View style={{ gap: 16, paddingBottom: 12 }}>
          <View style={{ gap: 8 }}>
            <Label>Color</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {COLORS.map(([n]) => (
                <Chip key={n} label={n} check on={colors.includes(n)} onPress={() => setColors((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]))} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Label>Show</Label>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Chip label="Favorites only" icon="favorite" on={favOnly} onPress={() => setFavOnly((v) => !v)} />
            </View>
          </View>
          {filtersOn ? <Button kind="secondary" label="Clear filters" height={48} onPress={() => (setColors([]), setFavOnly(false))} /> : null}
        </View>
      </Sheet>
    </Screen>
  );
}
