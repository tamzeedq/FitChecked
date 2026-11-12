import { useEffect } from 'react';
import { View } from 'react-native';

import { UNDO_WINDOW_MS, useStore } from '@/data/store';
import { radius, useTheme } from '@/theme';
import { Icon, Press, Txt } from './ui';

/** "<item> deleted · Undo". Finalizes the soft delete when the window runs out. */
export function UndoToast() {
  const t = useTheme();
  const pending = useStore((s) => s.pendingDelete);
  const item = useStore((s) => s.items.find((x) => x.id === s.pendingDelete));
  const undo = useStore((s) => s.undoDelete);
  const finalize = useStore((s) => s.finalizeDelete);

  useEffect(() => {
    if (!pending) return;
    const left = Math.max(0, UNDO_WINDOW_MS - (Date.now() - (item?.deletedAt ?? Date.now())));
    const id = setTimeout(finalize, left);
    return () => clearTimeout(id);
  }, [pending, item?.deletedAt, finalize]);

  if (!pending || !item) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        minHeight: 52,
        paddingLeft: 16,
        paddingRight: 8,
        borderRadius: radius.small,
        backgroundColor: t.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0px 12px 30px -10px rgba(0,0,0,0.4)',
      }}
    >
      <Icon name="delete" size={20} color={t.bg} />
      <Txt size={14.5} weight={500} color={t.bg} style={{ flex: 1 }} numberOfLines={2}>
        {item.name} deleted
      </Txt>
      <Press accessibilityRole="button" onPress={undo} style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center' }}>
        <Txt size={15} weight={700} color={t.bg}>
          Undo
        </Txt>
      </Press>
    </View>
  );
}
