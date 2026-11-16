import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { useItems, useStore } from '@/data/store';
import { CATEGORIES, COLORS, type Category, type ColorName, type Item } from '@/data/types';
import { GUTTER, radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';
import { Footer, ModalBar, Screen } from './Chrome';
import { DeleteItemDialog } from './DeleteItemDialog';
import { GarmentArt, TileBackground } from './Garment';
import { Button, Chip, Icon, Label, Press, Txt } from './ui';

const SINGULAR: Record<Category, string> = { Tops: 'top', Bottoms: 'bottoms', Outerwear: 'layer', Shoes: 'shoes', Accessories: 'accessory' };

function PhotoChip({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Press accessibilityRole="button" onPress={onPress} style={{ height: 36, paddingHorizontal: 12, borderRadius: radius.chip, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={18} />
      <Txt size={13.5} weight={600}>
        {label}
      </Txt>
    </Press>
  );
}

/** Add item / Edit item form. */
export function ItemForm({ item }: { item?: Item }) {
  const t = useTheme();
  const capture = useStore((s) => s.capture);
  const tagGroups = useStore((s) => s.tagGroups);
  const allItems = useItems();
  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);
  const setCapture = useStore((s) => s.setCapture);
  const edit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? capture?.suggestion?.category ?? 'Tops');
  const [color, setColor] = useState<ColorName>(item?.color ?? capture?.suggestion?.color ?? 'Cream');
  const [tags, setTags] = useState<string[]>(item?.tags ?? capture?.suggestion?.tags ?? []);
  const [confirm, setConfirm] = useState(false);

  // In edit mode the stored photo is used; a fresh capture (from Retake) replaces it.
  const freshCapture = edit ? capture?.originalUri && capture.originalUri !== item?.originalUri ? capture : null : capture;
  const photo = {
    photoUri: freshCapture ? freshCapture.photoUri : item?.photoUri,
    originalUri: freshCapture ? freshCapture.originalUri : item?.originalUri,
    silhouette: item?.silhouette,
  };
  const bgRemoved = !!photo.photoUri || !!photo.silhouette;

  // Most-used tags first, plus whatever is already selected.
  const tagChoices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const x of allItems) for (const tg of x.tags) counts.set(tg, (counts.get(tg) ?? 0) + 1);
    const all = tagGroups.flatMap((g) => g.tags);
    const top = [...all].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)).slice(0, 10);
    return [...top, ...tags.filter((x) => !top.includes(x))];
    // Keep the order stable while the user taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagGroups]);

  const close = () => {
    setCapture(null);
    router.back();
  };

  const save = () => {
    const finalName = name.trim() || `${color} ${SINGULAR[category]}`;
    if (item) {
      updateItem(item.id, { name: finalName, category, color, tags, ...(freshCapture ? { photoUri: freshCapture.photoUri, originalUri: freshCapture.originalUri } : {}) });
      setCapture(null);
      router.back();
    } else {
      const id = addItem({ name: finalName, category, color, tags, photoUri: photo.photoUri, originalUri: photo.originalUri });
      setCapture(null);
      router.dismissTo('/closet');
      setTimeout(() => router.push(`/item/${id}`), 0);
    }
  };

  // New items swap this screen out for the capture flow; edits come back to it.
  const retake = () => (edit ? router.push({ pathname: '/camera', params: { edit: '1' } }) : router.replace('/camera'));
  const toggleBg = () => {
    if (bgRemoved || !photo.originalUri) return;
    setCapture({ originalUri: photo.originalUri });
    if (edit) router.push({ pathname: '/processing', params: { edit: '1' } });
    else router.replace('/processing');
  };

  return (
    <Screen>
      <ModalBar title={edit ? 'Edit item' : 'New item'} onCancel={close} action="Save" onAction={save} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 24, gap: 20 }}>
        <TileBackground hue={item?.bgHue ?? 30} delta={item?.tileDelta} r={radius.card} muted={!bgRemoved} style={{ height: 250 }}>
          {photo.photoUri || photo.originalUri || photo.silhouette ? <GarmentArt item={photo} scale={0.76} /> : <Icon name="checkroom" size={64} color={t.muted} />}
          <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', gap: 8 }}>
            <PhotoChip icon="photo_camera" label="Retake" onPress={retake} />
            {photo.originalUri || photo.photoUri ? <PhotoChip icon={bgRemoved ? 'check' : 'auto_fix_high'} label={bgRemoved ? 'Background removed' : 'Remove background'} onPress={toggleBg} /> : null}
          </View>
        </TileBackground>

        <View style={{ gap: 8 }}>
          <Label>Name</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={`${color} ${SINGULAR[category]} (optional)`}
            placeholderTextColor={t.muted}
            returnKeyType="done"
            style={{ height: 50, borderRadius: radius.button, backgroundColor: t.inBg, borderWidth: 1, borderColor: t.inBd, paddingHorizontal: 14, fontSize: 16, fontFamily: family[600], color: t.ink }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Label>Category</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} on={c === category} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>Color</Label>
            <Txt size={13} weight={600}>
              {color}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {COLORS.map(([n, hex]) => (
              <Press
                key={n}
                accessibilityRole="radio"
                accessibilityLabel={n}
                accessibilityState={{ selected: n === color }}
                hitSlop={6}
                onPress={() => setColor(n)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: hex,
                  borderWidth: 1,
                  borderColor: 'rgba(128,128,128,0.35)',
                  boxShadow: n === color ? `0px 0px 0px 2px ${t.bg}, 0px 0px 0px 4px ${t.ink}` : undefined,
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>{`Tags · ${tags.length} selected`}</Label>
            <Press onPress={() => router.push('/tags')} hitSlop={10}>
              <Txt size={14} weight={600} color={t.accent}>
                Manage
              </Txt>
            </Press>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {tagChoices.map((x) => (
              <Chip key={x} label={x} check on={tags.includes(x)} onPress={() => setTags((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))} />
            ))}
          </View>
        </View>

        {item ? (
          <Press accessibilityRole="button" onPress={() => setConfirm(true)} style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="delete" size={20} color={t.danger} />
            <Txt size={15} weight={600} color={t.danger}>
              Delete item
            </Txt>
          </Press>
        ) : null}
      </ScrollView>
      <Footer>
        <Button label={edit ? 'Save changes' : 'Save to closet'} onPress={save} />
      </Footer>
      {item ? <DeleteItemDialog item={item} visible={confirm} onClose={() => setConfirm(false)} /> : null}
    </Screen>
  );
}
