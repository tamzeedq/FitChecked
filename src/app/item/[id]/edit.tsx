import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ItemForm } from '@/components/ItemForm';
import { useStore } from '@/data/store';

export default function EditItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useStore((s) => s.items.find((x) => x.id === id));

  useEffect(() => {
    if (!item) router.back();
  }, [item]);

  return item ? <ItemForm item={item} /> : null;
}
