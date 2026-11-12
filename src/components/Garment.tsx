import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import type { Item, ShapeKey, Silhouette } from '@/data/types';
import { oklch, tileGradient } from '@/lib/color';
import { radius as R, useTheme } from '@/theme';

// Placeholder silhouettes from the design reference (clip-path polygons, in % of the box).
const SHAPES: Record<ShapeKey, string> = {
  jacket: '36,12 44,10 50,20 56,10 64,12 80,24 88,78 77,80 70,42 70,90 30,90 30,42 23,80 12,78 20,24',
  sweater: '36,18 44,15 50,20 56,15 64,18 78,28 86,70 76,72 68,40 68,84 32,84 32,40 24,72 14,70 22,28',
  tee: '35,20 45,16 50,21 55,16 65,20 82,32 74,44 66,39 66,84 34,84 34,39 26,44 18,32',
  coat: '36,8 44,6 50,26 56,6 64,8 80,20 88,76 77,78 71,40 72,95 28,95 29,40 23,78 12,76 20,20',
  jeans: '32,10 68,10 73,92 56,92 50,36 44,92 27,92',
  skirt: '36,14 64,14 82,88 18,88',
  sneakers: '10,58 38,52 52,64 84,68 90,74 90,80 10,80',
  boots: '34,12 56,12 56,60 82,68 88,76 88,86 34,86',
  scarf: '28,12 72,12 72,30 60,34 64,90 48,90 46,36 28,30',
};

// CSS 165deg as gradient start/end points.
const START = { x: 0.37, y: 0.02 };
const END = { x: 0.63, y: 0.98 };

export function SilhouetteArt({ s, scale = 0.8, shadow = true }: { s: Silhouette; scale?: number; shadow?: boolean }) {
  const pct = `${scale * 100}%` as const;
  return (
    <View style={{ height: pct, aspectRatio: 1, maxWidth: '90%' }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {shadow ? <Polygon points={SHAPES[s.shape]} fill="rgba(0,0,0,0.13)" transform="translate(0 4)" /> : null}
        <Polygon points={SHAPES[s.shape]} fill={oklch(s.l, s.c, s.h)} />
      </Svg>
    </View>
  );
}

export function TileBackground({ hue, delta = 0, children, style, r = R.tile, muted }: { hue: number; delta?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle>; r?: number; muted?: boolean }) {
  const t = useTheme();
  const colors = muted ? ([t.surface2, t.surface2] as const) : tileGradient(hue, t.tileL, t.tileC, delta);
  return (
    <LinearGradient colors={colors} start={START} end={END} style={[{ borderRadius: r, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
    </LinearGradient>
  );
}

/** The garment on its tinted tile. Fills its container unless sized via `style`. */
export function Garment({ item, style, r = R.tile, scale = 0.8, mini }: { item: Pick<Item, 'bgHue' | 'tileDelta' | 'photoUri' | 'originalUri' | 'silhouette'>; style?: StyleProp<ViewStyle>; r?: number; scale?: number; mini?: boolean }) {
  return (
    <TileBackground hue={item.bgHue} delta={item.tileDelta} r={r} style={[{ flex: 1, minHeight: 0 }, style]}>
      <GarmentArt item={item} scale={mini ? 0.84 : scale} shadow={!mini} />
    </TileBackground>
  );
}

export function GarmentArt({ item, scale = 0.8, shadow = true }: { item: Pick<Item, 'photoUri' | 'originalUri' | 'silhouette'>; scale?: number; shadow?: boolean }) {
  if (item.photoUri) {
    const pct = `${scale * 100}%` as const;
    return <Image source={{ uri: item.photoUri }} contentFit="contain" style={{ width: pct, height: pct }} />;
  }
  if (item.originalUri) {
    return <Image source={{ uri: item.originalUri }} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />;
  }
  if (item.silhouette) return <SilhouetteArt s={item.silhouette} scale={scale} shadow={shadow} />;
  return null;
}

/** Dashed empty tile, e.g. an unlogged day. */
export function EmptyTile({ size, color, r = R.mini }: { size: number; color: string; r?: number }) {
  return <View style={{ width: size, height: size, borderRadius: r, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color }} />;
}
