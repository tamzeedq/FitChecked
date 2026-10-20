import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { ModalBar, Screen } from '@/components/Chrome';
import { Garment } from '@/components/Garment';
import { TagSheet, tagSummary } from '@/components/TagSheet';
import { Button, Card, Icon, Press, Txt } from '@/components/ui';
import { itemMap, useStore } from '@/data/store';
import type { Category, Item } from '@/data/types';
import { GUTTER, radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';

// Slot layout: Outerwear spans the left column; Top/Bottom and Shoes/Accessory stack.
const SLOTS: { label: string; category: Category }[][] = [
  [{ label: 'Outerwear', category: 'Outerwear' }],
  [
    { label: 'Top', category: 'Tops' },
    { label: 'Bottom', category: 'Bottoms' },
  ],
  [
    { label: 'Shoes', category: 'Shoes' },
    { label: 'Accessory', category: 'Accessories' },
  ],
];

function Slot({ label, item, onPress }: { label: string; item?: Item; onPress: () => void }) {
  const t = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel={`${label}: ${item?.name ?? 'empty'}`} onPress={onPress} style={{ flex: 1, minHeight: 0 }}>
      {item ? (
        <Garment item={item} />
      ) : (
        <View style={{ flex: 1, borderRadius: radius.tile, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.muted, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Icon name="add" size={24} color={t.muted} />
          <Txt size={12} weight={600} color={t.muted}>
            {label}
          </Txt>
        </View>
      )}
      <View style={{ position: 'absolute', top: 6, left: 6, paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.chip, backgroundColor: t.surface }}>
        <Txt size={10} weight={600} style={{ letterSpacing: 0.2 }}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

export default function Builder() {
  const t = useTheme();
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const saveDraft = useStore((s) => s.saveDraft);
  const items = itemMap(useStore((s) => s.items));
  const [sheet, setSheet] = useState<null | 'tags' | 'save'>(null);

  const pieces = draft.itemIds.map((id) => items.get(id)).filter((x): x is Item => !!x && !x.deletedAt);
  const inSlot = (c: Category) => pieces.find((x) => x.category === c);
  const extra = pieces.length - SLOTS.flat().filter((s) => inSlot(s.category)).length;
  const editing = !!draft.outfitId;
  const canSave = pieces.length > 0;

  const openPicker = (category?: Category) => router.push({ pathname: '/pick', params: category ? { category } : {} });

  const save = () => {
    const id = saveDraft();
    setSheet(null);
    router.back();
    if (!editing) setTimeout(() => router.push(`/outfit/${id}`), 0);
  };

  const cancel = () => {
    useStore.getState().startDraft();
    router.back();
  };

  return (
    <Screen>
      <ModalBar title={editing ? 'Edit outfit' : 'New outfit'} onCancel={cancel} action={canSave ? 'Save' : undefined} onAction={() => setSheet('save')} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 32, gap: 12 }}>
        <View style={{ height: 48, borderRadius: radius.button, backgroundColor: t.inBg, borderWidth: 1, borderColor: t.inBd, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 }}>
          <Txt size={12} color={t.muted} style={{ width: 44 }}>
            Name
          </Txt>
          <TextInput
            value={draft.name}
            onChangeText={(name) => updateDraft({ name })}
            placeholder="Untitled outfit"
            placeholderTextColor={t.muted}
            style={{ flex: 1, height: '100%', fontSize: 16, fontFamily: family[600], color: t.ink }}
          />
        </View>

        <Card style={{ padding: 10 }}>
          <View style={{ height: 232, flexDirection: 'row', gap: 8 }}>
            {SLOTS.map((col, i) => (
              <View key={i} style={{ flex: i === 0 ? 1.15 : 1, gap: 8 }}>
                {col.map((s) => (
                  <Slot key={s.label} label={s.label} item={inSlot(s.category)} onPress={() => openPicker(s.category)} />
                ))}
              </View>
            ))}
          </View>
          {extra > 0 ? (
            <Press onPress={() => openPicker()} style={{ paddingTop: 10, alignItems: 'center' }}>
              <Txt size={12.5} weight={600} color={t.muted}>{`+${extra} more piece${extra === 1 ? '' : 's'}`}</Txt>
            </Press>
          ) : null}
        </Card>

        <Card r={radius.small} onPress={() => setSheet('tags')} style={{ minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="sell" size={21} />
          <View style={{ flex: 1, gap: 1, minWidth: 0 }}>
            <Txt size={15} weight={600}>
              Tags
            </Txt>
            <Txt size={12.5} color={t.muted} numberOfLines={1}>
              {tagSummary(draft.tags)}
            </Txt>
          </View>
          <Icon name="chevron_right" color={t.muted} />
        </Card>

        <Card r={radius.small} style={{ minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="notes" size={21} />
          <TextInput
            value={draft.note}
            onChangeText={(note) => updateDraft({ note })}
            placeholder="Add a note (optional)"
            placeholderTextColor={t.muted}
            multiline
            style={{ flex: 1, fontSize: 15, fontFamily: family[400], color: t.ink, paddingVertical: 14 }}
          />
        </Card>

        <Button style={{ marginTop: 8 }} label="Save outfit" disabled={!canSave} onPress={() => setSheet('save')} />
      </ScrollView>

      <TagSheet
        visible={!!sheet}
        selected={draft.tags}
        onChange={(tags) => updateDraft({ tags })}
        subtitle={`${draft.tags.length} selected for ${draft.name.trim() || 'this outfit'}`}
        onDone={sheet === 'save' ? save : () => setSheet(null)}
      />
    </Screen>
  );
}
