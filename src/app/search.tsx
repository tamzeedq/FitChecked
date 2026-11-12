import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { Garment } from '@/components/Garment';
import { Card, Chip, Icon, Label, Press, Row, Txt } from '@/components/ui';
import { itemMap, outfitItems, useItems, useOutfits, useStore } from '@/data/store';
import type { Item } from '@/data/types';
import { GUTTER, radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';

function matchWhy(x: Item, q: string): 'Tag' | 'Color' | 'Name' | 'Category' | null {
  if (x.tags.some((t) => t === q)) return 'Tag';
  if (x.color.toLowerCase() === q) return 'Color';
  if (x.name.toLowerCase().includes(q)) return 'Name';
  if (x.category.toLowerCase().startsWith(q)) return 'Category';
  if (x.tags.some((t) => t.startsWith(q))) return 'Tag';
  return null;
}

export default function Search() {
  const t = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const items = useItems();
  const outfits = useOutfits();
  const map = itemMap(useStore((s) => s.items));
  const recent = useStore((s) => s.recentSearches);
  const addRecent = useStore((s) => s.addRecentSearch);
  const query = q.trim().toLowerCase();

  const res = useMemo(() => (query ? items.map((x) => ({ x, why: matchWhy(x, query) })).filter((r) => r.why) : []), [items, query]);
  const outs = useMemo(() => (query ? outfits.filter((o) => o.tags.some((tg) => tg.startsWith(query)) || o.name.toLowerCase().includes(query)) : []), [outfits, query]);

  const open = (href: Parameters<typeof router.push>[0]) => {
    addRecent(query);
    router.push(href);
  };

  return (
    <Screen tab={1}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: GUTTER, paddingTop: 4 }}>
        <View style={{ flex: 1, height: 46, borderRadius: radius.button, backgroundColor: t.inBg, borderWidth: 1.5, borderColor: t.accent, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
          <Icon name="search" size={21} color={t.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus={!params.q}
            placeholder="Search items, colors, tags"
            placeholderTextColor={t.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => addRecent(query)}
            style={{ flex: 1, height: '100%', fontSize: 16, fontFamily: family[600], color: t.ink }}
          />
          {q ? (
            <Press accessibilityLabel="Clear" onPress={() => setQ('')} hitSlop={10}>
              <Icon name="cancel" size={20} color={t.muted} />
            </Press>
          ) : null}
        </View>
        <Press accessibilityRole="button" onPress={() => router.back()} style={{ height: 44, justifyContent: 'center' }}>
          <Txt size={16} weight={600} color={t.accent}>
            Cancel
          </Txt>
        </Press>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 14, paddingBottom: 32, gap: 14 }}>
        {recent.length ? (
          <View style={{ gap: 8 }}>
            <Label>Recent</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {recent.map((x) => (
                <Chip key={x} label={x} icon="history" height={34} on={x === query} onPress={() => setQ(x)} />
              ))}
            </View>
          </View>
        ) : null}

        {res.length ? (
          <View style={{ gap: 8 }}>
            <Label>{`Items · ${res.length} ${res.length === 1 ? 'item' : 'items'}`}</Label>
            <Card style={{ overflow: 'hidden' }}>
              {res.map(({ x, why }, i) => (
                <Row key={x.id} first={i === 0} onPress={() => open(`/item/${x.id}`)} style={{ paddingVertical: 9 }}>
                  <View style={{ width: 46, height: 46 }}>
                    <Garment item={x} r={radius.small} mini />
                  </View>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <Txt size={15} weight={600} numberOfLines={1}>
                      {x.name}
                    </Txt>
                    <Txt size={12.5} color={t.muted}>{`${x.category} · ${x.color}`}</Txt>
                  </View>
                  <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.chip, backgroundColor: t.chipOnBg }}>
                    <Txt size={11.5} weight={600} color={t.chipOnInk}>
                      {why}
                    </Txt>
                  </View>
                </Row>
              ))}
            </Card>
          </View>
        ) : null}

        {outs.length ? (
          <View style={{ gap: 8 }}>
            <Label>{`${outs.length} outfit${outs.length === 1 ? '' : 's'} tagged ${query}`}</Label>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {outs.slice(0, 3).map((o) => (
                <Press key={o.id} onPress={() => open(`/outfit/${o.id}`)} style={{ flex: 1, maxWidth: '32%', gap: 6, minWidth: 0 }}>
                  <Card r={radius.small} style={{ padding: 6 }}>
                    <MiniCollage items={outfitItems(o, map)} gap={3} />
                  </Card>
                  <Txt size={12.5} weight={600} numberOfLines={1}>
                    {o.name}
                  </Txt>
                </Press>
              ))}
            </View>
          </View>
        ) : null}

        {query && !res.length && !outs.length ? (
          <View style={{ paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', gap: 10 }}>
            <Icon name="search_off" size={40} color={t.muted} />
            <Txt size={16} weight={600} style={{ textAlign: 'center' }}>{`No items match “${q.trim()}”`}</Txt>
            <Txt size={14} lh={1.45} color={t.muted} style={{ textAlign: 'center' }}>
              Try a color, a category, or a tag from Tag manager.
            </Txt>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
