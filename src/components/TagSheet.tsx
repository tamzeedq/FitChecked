import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { useStore } from '@/data/store';
import type { TagGroupName } from '@/data/types';
import { groupDot } from '@/lib/color';
import { radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';
import { Sheet } from './Chrome';
import { AddChip, Chip, H2, Label, Press, Txt } from './ui';

/** Tag picker grouped by Occasion, Mood, Weather and Season. */
export function TagSheet({ visible, selected, onChange, onDone, subtitle }: { visible: boolean; selected: string[]; onChange: (tags: string[]) => void; onDone: () => void; subtitle: string }) {
  const t = useTheme();
  const groups = useStore((s) => s.tagGroups);
  const addTag = useStore((s) => s.addTag);
  const [adding, setAdding] = useState<TagGroupName | null>(null);
  const [draft, setDraft] = useState('');

  const toggle = (x: string) => onChange(selected.includes(x) ? selected.filter((y) => y !== x) : [...selected, x]);
  const commit = () => {
    const v = draft.trim().toLowerCase();
    if (adding && v) {
      addTag(adding, v);
      if (!selected.includes(v)) onChange([...selected, v]);
    }
    setAdding(null);
    setDraft('');
  };

  return (
    <Sheet visible={visible} onClose={onDone} height={520}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 6 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <H2 lh={1.1}>Tags</H2>
          <Txt size={12.5} color={t.muted} numberOfLines={1}>
            {subtitle}
          </Txt>
        </View>
        <Press accessibilityRole="button" onPress={onDone} style={{ height: 44, paddingLeft: 12, paddingRight: 4, justifyContent: 'center' }}>
          <Txt size={16} weight={700} color={t.accent}>
            Done
          </Txt>
        </Press>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingTop: 6, paddingBottom: 24 }}>
        {groups.map((g) => {
          const n = g.tags.filter((x) => selected.includes(x)).length;
          return (
            <View key={g.name} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: groupDot(g.hue) }} />
                <Label>{g.name}</Label>
                <Txt size={12} color={t.muted} style={{ marginLeft: 'auto' }}>
                  {n ? `${n} selected` : ''}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {g.tags.map((x) => (
                  <Chip key={x} label={x} check on={selected.includes(x)} onPress={() => toggle(x)} />
                ))}
                {adding === g.name ? (
                  <TextInput
                    autoFocus
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={commit}
                    onBlur={commit}
                    placeholder="New tag"
                    placeholderTextColor={t.muted}
                    autoCapitalize="none"
                    returnKeyType="done"
                    style={{ height: 36, minWidth: 110, paddingHorizontal: 13, borderRadius: radius.chip, borderWidth: 1.5, borderColor: t.accent, fontSize: 14, fontFamily: family[500], color: t.ink }}
                  />
                ) : (
                  <AddChip onPress={() => setAdding(g.name)} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

export function tagSummary(tags: string[]) {
  if (!tags.length) return 'None yet';
  const c = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return tags.slice(0, 3).map(c).join(', ') + (tags.length > 3 ? ` +${tags.length - 3}` : '');
}
