import { router } from 'expo-router';
import { View } from 'react-native';

import { useStore } from '@/data/store';
import type { Item } from '@/data/types';
import { useTheme } from '@/theme';
import { Dialog } from './Chrome';
import { Button, H2, IconCircle, Press, Txt } from './ui';

export function DeleteItemDialog({ item, visible, onClose }: { item: Item; visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const n = useStore((s) => s.outfits.filter((o) => o.itemIds.includes(item.id)).length);
  const requestDelete = useStore((s) => s.requestDelete);

  const confirm = () => {
    onClose();
    requestDelete(item.id);
    router.dismissTo('/closet');
  };

  return (
    <Dialog visible={visible} onClose={onClose}>
      <View style={{ marginBottom: 6 }}>
        <IconCircle name="delete" size={48} iconSize={26} color={t.danger} />
      </View>
      <H2>{`Delete ${item.name}?`}</H2>
      <Txt size={14.5} lh={1.45} color={t.muted}>
        {`It will be removed from ${n} outfit${n === 1 ? '' : 's'}. Days you wore it stay in your calendar.`}
      </Txt>
      <Button kind="danger" label="Delete item" height={52} style={{ marginTop: 12 }} onPress={confirm} />
      <Press accessibilityRole="button" onPress={onClose} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={16} weight={600}>
          Keep it
        </Txt>
      </Press>
    </Dialog>
  );
}

