import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BackBar, BarIcon, Scroll, Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { DeleteItemDialog } from '@/components/DeleteItemDialog';
import { Garment } from '@/components/Garment';
import { Button, Card, Chip, H1, Label, Press, Txt } from '@/components/ui';
import { cap, itemMap, outfitItems, useOutfits, useStore } from '@/data/store';
import { addDays, daysSince, dateKey, shortDate } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

export default function ItemDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useStore((s) => s.items);
  const outfits = useOutfits();
  const log = useStore((s) => s.log);
  const allOutfits = useStore((s) => s.outfits);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [confirm, setConfirm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const item = items.find((x) => x.id === id);
  const map = itemMap(items);
  const inOutfits = useMemo(() => outfits.filter((o) => o.itemIds.includes(id)), [outfits, id]);

  // Last 4 weeks: did any outfit logged that day include this item?
  const hist = useMemo(() => {
    const ids = new Set(allOutfits.filter((o) => o.itemIds.includes(id)).map((o) => o.id));
    return Array.from({ length: 28 }, (_, i) => (log[dateKey(addDays(new Date(), i - 27))] ?? []).some((x) => ids.has(x)));
  }, [allOutfits, id, log]);

  if (!item) {
    return (
      <Screen tab={1}>
        <BackBar label="Closet" />
        <Txt color={t.muted} style={{ padding: 20 }}>
          This item was deleted.
        </Txt>
      </Screen>
    );
  }

  const since = item.lastWorn ? daysSince(item.lastWorn) : null;
  const stats: [string, string][] = [
    [String(item.wearCount), 'Times worn'],
    [since === null ? '–' : since === 0 ? 'Today' : `${since} day${since === 1 ? '' : 's'}`, 'Since last worn'],
    [String(inOutfits.length), inOutfits.length === 1 ? 'Outfit' : 'Outfits'],
  ];

  return (
    <Screen tab={1}>
      <BackBar
        label="Closet"
        right={
          <>
            <BarIcon label={item.favorite ? 'Unfavorite' : 'Favorite'} name={item.favorite ? 'favorite' : 'favorite_border'} color={item.favorite ? t.accent : t.ink} onPress={() => toggleFavorite(item.id)} />
            <BarIcon label="More" name="more_horiz" onPress={() => setConfirm(true)} />
          </>
        }
      />
      <Scroll gap={16}>
        <View style={{ height: 290 }}>
          <Garment item={item} r={radius.card} scale={0.76} />
        </View>
        <View style={{ gap: 6 }}>
          <H1>{item.name}</H1>
          <Txt size={14} color={t.muted}>{`${item.category} · ${item.color} · Added ${shortDate(item.createdAt)}`}</Txt>
        </View>
        <Card style={{ flexDirection: 'row', paddingVertical: 14 }}>
          {stats.map(([v, l], i) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', gap: 3, borderLeftWidth: i ? 1 : 0, borderLeftColor: t.line }}>
              <Txt size={22} weight={700} lh={1.1} style={{ letterSpacing: -0.55 }}>
                {v}
              </Txt>
              <Txt size={12} color={t.muted}>
                {l}
              </Txt>
            </View>
          ))}
        </Card>
        {item.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {item.tags.map((x) => (
              <Chip key={x} label={cap(x)} onPress={() => router.push({ pathname: '/search', params: { q: x } })} />
            ))}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>{`In ${inOutfits.length} outfit${inOutfits.length === 1 ? '' : 's'}`}</Label>
            {inOutfits.length > 3 ? (
              <Press onPress={() => setShowAll((v) => !v)} hitSlop={10}>
                <Txt size={14} weight={600} color={t.accent}>
                  {showAll ? 'Show less' : 'See all'}
                </Txt>
              </Press>
            ) : null}
          </View>
          {inOutfits.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(showAll ? inOutfits : inOutfits.slice(0, 3)).map((o) => (
                <Press key={o.id} onPress={() => router.push(`/outfit/${o.id}`)} style={{ width: '31%', flexGrow: 1, maxWidth: '32%', gap: 6, minWidth: 0 }}>
                  <Card r={radius.small} style={{ padding: 6 }}>
                    <MiniCollage items={outfitItems(o, map)} gap={3} />
                  </Card>
                  <Txt size={12.5} weight={600} numberOfLines={1}>
                    {o.name}
                  </Txt>
                </Press>
              ))}
            </View>
          ) : (
            <Txt size={14} color={t.muted}>
              Not in any outfits yet.
            </Txt>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <Label>{`Last 4 weeks · ${hist.filter(Boolean).length} wears`}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {hist.map((w, i) => (
              <View key={i} style={{ width: `${100 / 14 - 0.9}%`, aspectRatio: 1, flexGrow: 1, borderRadius: 4, backgroundColor: w ? t.accent : t.surface2 }} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Button
            style={{ flex: 1 }}
            height={52}
            size={15}
            iconSize={19}
            icon="style"
            label="Build an outfit"
            onPress={() => {
              useStore.getState().startDraft({ itemIds: [item.id] });
              router.push('/builder');
            }}
          />
          <Button kind="secondary" height={52} size={15} iconSize={19} icon="edit" label="Edit" style={{ paddingHorizontal: 20 }} onPress={() => router.push(`/item/${item.id}/edit`)} />
        </View>
      </Scroll>
      <DeleteItemDialog item={item} visible={confirm} onClose={() => setConfirm(false)} />
    </Screen>
  );
}
