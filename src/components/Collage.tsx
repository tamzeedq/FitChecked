import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { Item } from '@/data/types';
import { radius, useTheme } from '@/theme';
import { Garment } from './Garment';

/**
 * Hero collage: a tall tile on the left, then a 2-row middle column and a tall right tile
 * (grid 1.1fr 1fr 1fr × 2 rows). Falls back gracefully for fewer than four pieces.
 */
export function HeroCollage({ items, height, gap = 8, r = radius.tile, firstCol = 1.1, style }: { items: Item[]; height: number; gap?: number; r?: number; firstCol?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const [a, b, c, d] = items;
  if (!a) return <View style={[{ height, borderRadius: r, backgroundColor: t.surface2 }, style]} />;
  const cols: Item[][] = [[a], [b, c].filter(Boolean) as Item[], d ? [d] : []].filter((x) => x.length);
  const flex = [firstCol, 1, 1];
  return (
    <View style={[{ height, flexDirection: 'row', gap }, style]}>
      {cols.map((col, i) => (
        <View key={i} style={{ flex: flex[i], gap }}>
          {col.map((x) => (
            <Garment key={x.id} item={x} r={r} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** 2×2 mini collage for outfit thumbnails. */
export function MiniCollage({ items, size, gap = 2, r = radius.mini, style }: { items: Item[]; size?: number; gap?: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const four = items.slice(0, 4);
  const rows = [four.slice(0, 2), four.slice(2, 4)];
  return (
    <View style={[size ? { width: size, height: size } : { aspectRatio: 1, width: '100%' }, { gap }, style]}>
      {rows.map((row, i) => (
        <View key={i} style={{ flex: 1, flexDirection: 'row', gap }}>
          {[0, 1].map((j) =>
            row[j] ? <Garment key={row[j].id} item={row[j]} r={r} mini /> : <View key={j} style={{ flex: 1, borderRadius: r, backgroundColor: t.surface2 }} />,
          )}
        </View>
      ))}
    </View>
  );
}
