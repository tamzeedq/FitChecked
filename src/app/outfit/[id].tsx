import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { BackBar, BarIcon, Dialog, Scroll, Screen } from '@/components/Chrome';
import { HeroCollage } from '@/components/Collage';
import { Garment } from '@/components/Garment';
import { ShareSheet } from '@/components/ShareSheet';
import { Button, Card, Chip, H1, H2, Label, Press, Row, Txt, Icon } from '@/components/ui';
import { cap, itemMap, outfitItems, useStore } from '@/data/store';
import { shortDate, todayKey } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

export default function OutfitDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfit = useStore((s) => s.outfits.find((o) => o.id === id));
  const items = itemMap(useStore((s) => s.items));
  const log = useStore((s) => s.log);
  const logOutfits = useStore((s) => s.logOutfits);
  const unlogOutfit = useStore((s) => s.unlogOutfit);
  const deleteOutfit = useStore((s) => s.deleteOutfit);
  const [share, setShare] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (!outfit) {
    return (
      <Screen tab={2}>
        <BackBar label="Outfits" />
        <Txt color={t.muted} style={{ padding: 20 }}>
          This outfit was deleted.
        </Txt>
      </Screen>
    );
  }

  const pieces = outfitItems(outfit, items);
  const tKey = todayKey();
  const worn = (log[tKey] ?? []).includes(outfit.id);

  const edit = () => {
    useStore.getState().startDraft(outfit);
    router.push('/builder');
  };

  const more = () => {
    if (Platform.OS === 'web') return setConfirm(true);
    Alert.alert(outfit.name, undefined, [
      { text: 'Edit outfit', onPress: edit },
      { text: 'Delete outfit', style: 'destructive', onPress: () => setConfirm(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Screen tab={2}>
      <BackBar
        label="Outfits"
        right={
          <>
            <BarIcon label="Share" name="ios_share" onPress={() => setShare(true)} />
            <BarIcon label="More" name="more_horiz" onPress={more} />
          </>
        }
      />
      <Scroll gap={16}>
        <Card style={{ padding: 10 }}>
          <HeroCollage items={pieces} height={260} />
        </Card>
        <View style={{ gap: 6 }}>
          <Label color={t.accent}>{outfit.lastWorn ? `Last worn ${shortDate(outfit.lastWorn)}` : 'Not worn yet'}</Label>
          <H1>{outfit.name}</H1>
          <Txt size={14} color={t.muted}>{`Worn ${outfit.wearCount} ${outfit.wearCount === 1 ? 'time' : 'times'} · ${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}`}</Txt>
        </View>
        {outfit.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {outfit.tags.map((x) => (
              <Chip key={x} label={cap(x)} onPress={() => router.push({ pathname: '/search', params: { q: x } })} />
            ))}
          </View>
        ) : null}
        {outfit.note ? (
          <Txt size={14.5} lh={1.45}>
            {outfit.note}
          </Txt>
        ) : null}
        <View style={{ gap: 8 }}>
          <Label>Pieces</Label>
          <Card style={{ overflow: 'hidden' }}>
            {pieces.map((x, i) => (
              <Row key={x.id} first={i === 0} onPress={() => router.push(`/item/${x.id}`)} style={{ paddingVertical: 10 }}>
                <View style={{ width: 50, height: 50 }}>
                  <Garment item={x} r={radius.small} mini />
                </View>
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Txt size={15} weight={600} numberOfLines={1}>
                    {x.name}
                  </Txt>
                  <Txt size={12.5} color={t.muted}>{`${x.category} · worn ${x.wearCount}×`}</Txt>
                </View>
                <Icon name="chevron_right" color={t.muted} />
              </Row>
            ))}
            {!pieces.length ? (
              <Row first>
                <Txt size={14} color={t.muted}>
                  No pieces left in this outfit.
                </Txt>
              </Row>
            ) : null}
          </Card>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            style={{ flex: 1 }}
            height={52}
            size={15}
            iconSize={19}
            icon={worn ? 'check' : 'checkroom'}
            label={worn ? 'Logged for today' : 'Wear this today'}
            onPress={() => (worn ? unlogOutfit(tKey, outfit.id) : logOutfits(tKey, [outfit.id]))}
          />
          <Button kind="secondary" height={52} size={15} iconSize={19} icon="edit" label="Edit" style={{ paddingHorizontal: 20 }} onPress={edit} />
        </View>
      </Scroll>

      <ShareSheet outfit={outfit} items={pieces} visible={share} onClose={() => setShare(false)} />

      <Dialog visible={confirm} onClose={() => setConfirm(false)}>
        <H2>{`Delete ${outfit.name}?`}</H2>
        <Txt size={14.5} lh={1.45} color={t.muted}>
          The pieces stay in your closet. Days you wore it stay in your calendar.
        </Txt>
        <Button
          kind="danger"
          label="Delete outfit"
          height={52}
          style={{ marginTop: 12 }}
          onPress={() => {
            setConfirm(false);
            router.back();
            deleteOutfit(outfit.id);
          }}
        />
        <Press accessibilityRole="button" onPress={() => setConfirm(false)} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} weight={600}>
            Keep it
          </Txt>
        </Press>
      </Dialog>
    </Screen>
  );
}
