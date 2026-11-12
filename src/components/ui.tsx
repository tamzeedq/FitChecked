import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';

import { radius, useTheme } from '@/theme';
import { family, type Weight } from '@/theme/fonts';

// ---------- Text ----------

type TxtProps = TextProps & { size?: number; weight?: Weight; color?: string; lh?: number; style?: StyleProp<TextStyle> };

export function Txt({ size = 15, weight = 400, color, lh, style, ...rest }: TxtProps) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[{ fontFamily: family[weight], fontSize: size, color: color ?? t.ink, lineHeight: lh ? size * lh : undefined }, style]}
    />
  );
}

/** Screen title: 30 / 700 / -0.025em / 1.05 */
export function H1({ style, size = 30, ...rest }: TxtProps) {
  return <Txt size={size} weight={700} lh={1.05} style={[{ letterSpacing: -0.025 * size, paddingTop: 2 }, style]} {...rest} />;
}

/** Section / dialog title: 20 / 700 / -0.025em / 1.15 */
export function H2({ style, size = 20, ...rest }: TxtProps) {
  return <Txt size={size} weight={700} lh={1.15} style={[{ letterSpacing: -0.025 * size }, style]} {...rest} />;
}

/** Section label: 13 / 600, sentence case. */
export function Label({ color, ...rest }: TxtProps) {
  const t = useTheme();
  return <Txt size={13} weight={600} color={color ?? t.muted} {...rest} />;
}

// ---------- Icon ----------

type GlyphName = ComponentProps<typeof MaterialIcons>['name'];

// Material Symbols names that differ in the Material Icons set.
const ALIASES: Record<string, string> = { rainy: 'umbrella', sunny: 'wb-sunny', partly_cloudy_day: 'wb-cloudy' };

export type IconName = string;

export function Icon({ name, size = 22, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  const glyph = (ALIASES[name] ?? name.replace(/_/g, '-')) as GlyphName;
  return <MaterialIcons name={glyph} size={size} color={color ?? t.ink} style={style} />;
}

// ---------- Press ----------

export function Press({ style, ...rest }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return <Pressable {...rest} style={({ pressed }) => [style, pressed && { opacity: 0.7 }]} />;
}

// ---------- Buttons ----------

type ButtonKind = 'primary' | 'secondary' | 'text' | 'danger';

export function Button({
  label,
  icon,
  kind = 'primary',
  height = 54,
  onPress,
  style,
  disabled,
  size = 16,
  iconSize = 20,
}: {
  label: string;
  icon?: IconName;
  kind?: ButtonKind;
  height?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  size?: number;
  iconSize?: number;
}) {
  const t = useTheme();
  const bg = { primary: t.btnBg, secondary: t.btn2Bg, text: 'transparent', danger: t.danger }[kind];
  const ink = { primary: t.btnInk, secondary: t.btn2Ink, text: t.muted, danger: t.bg }[kind];
  return (
    <Press
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          height,
          borderRadius: radius.button,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 16,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={iconSize} color={ink} /> : null}
      <Txt size={size} weight={600} color={ink} numberOfLines={1}>
        {label}
      </Txt>
    </Press>
  );
}

/** Square icon button, e.g. the + on Closet. */
export function IconButton({ icon, onPress, size = 48, kind = 'primary', label }: { icon: IconName; onPress?: () => void; size?: number; kind?: 'primary' | 'secondary'; label: string }) {
  const t = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: radius.button,
        backgroundColor: kind === 'primary' ? t.btnBg : t.btn2Bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={kind === 'primary' ? 26 : 22} color={kind === 'primary' ? t.btnInk : t.btn2Ink} />
    </Press>
  );
}

// ---------- Chip ----------

export function Chip({
  label,
  on,
  onPress,
  check,
  icon,
  height = 36,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  /** Show a check mark when selected (tag pickers). */
  check?: boolean;
  icon?: IconName;
  height?: number;
}) {
  const t = useTheme();
  const ink = on ? t.chipOnInk : t.chipInk;
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      hitSlop={4}
      style={{
        height,
        paddingHorizontal: 13,
        borderRadius: radius.chip,
        backgroundColor: on ? t.chipOnBg : t.chipBg,
        borderWidth: 1,
        borderColor: on ? t.chipOnBd : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {check && on ? <Icon name="check" size={16} color={ink} style={{ marginLeft: -3 }} /> : null}
      {icon ? <Icon name={icon} size={16} color={ink} /> : null}
      <Txt size={14} weight={500} color={ink}>
        {label}
      </Txt>
    </Press>
  );
}

/** Dashed "+ New" chip. */
export function AddChip({ label = 'New', onPress }: { label?: string; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Press
      onPress={onPress}
      style={{ height: 36, paddingHorizontal: 13, borderRadius: radius.chip, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.muted, flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      <Icon name="add" size={16} color={t.muted} />
      <Txt size={14} weight={500} color={t.muted}>
        {label}
      </Txt>
    </Press>
  );
}

// ---------- Surfaces ----------

export function Card({ children, style, r = radius.card, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; r?: number; onPress?: () => void }) {
  const t = useTheme();
  const s: StyleProp<ViewStyle> = [{ backgroundColor: t.surface, borderRadius: r, boxShadow: t.cardShadow }, style];
  return onPress ? (
    <Press onPress={onPress} style={s}>
      {children}
    </Press>
  ) : (
    <View style={s}>{children}</View>
  );
}

/** Round icon well used in rows and dialogs. */
export function IconCircle({ name, size = 44, iconSize = 22, color, bg, r }: { name: IconName; size?: number; iconSize?: number; color?: string; bg?: string; r?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: r ?? size / 2, backgroundColor: bg ?? t.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={iconSize} color={color} />
    </View>
  );
}

/** iOS-style 51×31 switch drawn to the Linen spec. */
export function Toggle({ on, onPress, label }: { on: boolean; onPress?: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Press
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: 51, height: 31, padding: 2, borderRadius: 16, backgroundColor: on ? t.accent : t.line, alignItems: on ? 'flex-end' : 'flex-start' }}
    >
      <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: '#ffffff', boxShadow: '0px 2px 4px rgba(0,0,0,0.2)' }} />
    </Press>
  );
}

export function Segmented<T extends string>({ options, value, onChange, height = 30, fill }: { options: [T, string][]; value: T; onChange: (v: T) => void; height?: number; fill?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', padding: fill ? 3 : 2, gap: fill ? 3 : 2, borderRadius: radius.chip, backgroundColor: t.surface2 }}>
      {options.map(([k, l]) => {
        const a = k === value;
        return (
          <Press
            key={k}
            accessibilityRole="button"
            accessibilityState={{ selected: a }}
            onPress={() => onChange(k)}
            style={[
              { height, paddingHorizontal: 11, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
              fill && { flex: 1 },
              fill
                ? { backgroundColor: a ? t.chipOnBg : 'transparent' }
                : { backgroundColor: a ? t.surface : 'transparent', boxShadow: a ? '0px 1px 3px rgba(0,0,0,0.18)' : undefined },
            ]}
          >
            <Txt size={fill ? 14 : 13} weight={600} color={a ? (fill ? t.chipOnInk : t.ink) : t.muted}>
              {l}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

/** Grouped list row with a top hairline after the first row. */
export function Row({ first, children, onPress, minHeight = 52, style }: { first?: boolean; children: ReactNode; onPress?: () => void; minHeight?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const s: StyleProp<ViewStyle> = [
    { minHeight, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderTopWidth: first ? 0 : 1, borderTopColor: t.line },
    style,
  ];
  return onPress ? (
    <Press onPress={onPress} style={s}>
      {children}
    </Press>
  ) : (
    <View style={s}>{children}</View>
  );
}

export function Grabber() {
  const t = useTheme();
  return <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: t.line, alignSelf: 'center' }} />;
}
