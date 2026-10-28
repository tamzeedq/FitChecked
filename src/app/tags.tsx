import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { BackBar, Scroll, Screen } from '@/components/Chrome';
import { Card, H1, Icon, Label, Press, Row, Txt } from '@/components/ui';
import { cap, useItems, useOutfits, useStore } from '@/data/store';
import type { TagGroupName } from '@/data/types';
import { groupDot } from '@/lib/color';
import { useTheme } from '@/theme';
import { family } from '@/theme/fonts';

export default function TagManager() {
  const t = useTheme();
  const groups = useStore((s) => s.tagGroups);
  const items = useItems();
  const outfits = useOutfits();
  const deleteTag = useStore((s) => s.deleteTag);
  const addTag = useStore((s) => s.addTag);
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState<TagGroupName | null>(null);
  const [draft, setDraft] = useState('');

  const usage = useMemo(() => {
    const m = new Map<string, [number, number]>();
    const bump = (tag: string, i: 0 | 1) => {
      const v = m.get(tag) ?? [0, 0];
      v[i]++;
      m.set(tag, v);
    };
    items.forEach((x) => x.tags.forEach((tg) => bump(tg, 0)));
    outfits.forEach((o) => o.tags.forEach((tg) => bump(tg, 1)));
    return m;
  }, [items, outfits]);

  const total = groups.reduce((n, g) => n + g.tags.length, 0);
  const commit = () => {
    if (adding && draft.trim()) addTag(adding, draft);
    setAdding(null);
    setDraft('');
  };

  return (
    <Screen tab={4}>
      <BackBar
        label="Profile"
        right={
          <Press accessibilityRole="button" onPress={() => setEdit((v) => !v)} style={{ height: 44, paddingLeft: 12, paddingRight: 4, justifyContent: 'center' }}>
            <Txt size={16} weight={700} color={t.accent}>
              {edit ? 'Done' : 'Edit'}
            </Txt>
          </Press>
        }
      />
      <Scroll gap={18}>
        <View style={{ gap: 6 }}>
          <H1>Tags</H1>
          <Txt size={14} lh={1.45} color={t.muted}>{`${total} tags in ${groups.length} groups. Tags drive closet filters and daily suggestions.`}</Txt>
        </View>
        {groups.map((g) => (
          <View key={g.name} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: groupDot(g.hue) }} />
              <Label>{g.name}</Label>
              <Txt size={12} color={t.muted} style={{ marginLeft: 'auto' }}>
                {String(g.tags.length)}
              </Txt>
            </View>
            <Card style={{ overflow: 'hidden' }}>
              {g.tags.map((tag, i) => {
                const [ni, no] = usage.get(tag) ?? [0, 0];
                return (
                  <Row key={tag} first={i === 0} minHeight={50} onPress={edit ? undefined : () => router.push({ pathname: '/search', params: { q: tag } })} style={{ gap: 10 }}>
                    {edit ? (
                      <Press accessibilityRole="button" accessibilityLabel={`Delete ${tag}`} onPress={() => deleteTag(tag)} hitSlop={10} style={{ marginLeft: -4 }}>
                        <Icon name="do_not_disturb_on" size={22} color={t.danger} />
                      </Press>
                    ) : null}
                    <Txt size={15} weight={500} style={{ flex: 1 }}>
                      {cap(tag)}
                    </Txt>
                    <Txt size={12.5} color={t.muted}>{`${ni} item${ni === 1 ? '' : 's'} · ${no} outfit${no === 1 ? '' : 's'}`}</Txt>
                    <Icon name={edit ? 'drag_indicator' : 'chevron_right'} size={20} color={t.muted} />
                  </Row>
                );
              })}
              {adding === g.name ? (
                <Row first={!g.tags.length} minHeight={50}>
                  <TextInput
                    autoFocus
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={commit}
                    onBlur={commit}
                    placeholder={`New ${g.name.toLowerCase()} tag`}
                    placeholderTextColor={t.muted}
                    autoCapitalize="none"
                    returnKeyType="done"
                    style={{ flex: 1, height: 50, fontSize: 15, fontFamily: family[500], color: t.ink }}
                  />
                </Row>
              ) : (
                <Row first={!g.tags.length} minHeight={50} onPress={() => setAdding(g.name)} style={{ gap: 8 }}>
                  <Icon name="add" size={20} color={t.accent} />
                  <Txt size={15} weight={600} color={t.accent}>
                    Add tag
                  </Txt>
                </Row>
              )}
            </Card>
          </View>
        ))}
      </Scroll>
    </Screen>
  );
}
