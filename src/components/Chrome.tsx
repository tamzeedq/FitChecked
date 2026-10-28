import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dialogShadow, GUTTER, radius, TAB_BAR_HEIGHT, useTheme } from '@/theme';
import { Grabber, Icon, Press, Txt, type IconName } from './ui';

export const TABS: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'home', label: 'Home', href: '/' },
  { icon: 'checkroom', label: 'Closet', href: '/closet' },
  { icon: 'style', label: 'Outfits', href: '/outfits' },
  { icon: 'calendar_month', label: 'Calendar', href: '/calendar' },
  { icon: 'person', label: 'Profile', href: '/profile' },
];

/** Five-tab bar. Also drawn on pushed screens (item, outfit, search…) with the parent tab active. */
export function TabBar({ active, onSelect }: { active: number; onSelect?: (i: number) => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        paddingHorizontal: 6,
        backgroundColor: t.tabBg,
        borderTopWidth: 1,
        borderTopColor: t.line,
        flexDirection: 'row',
      }}
    >
      {TABS.map((tab, i) => {
        const on = i === active;
        const color = on ? t.tabOn : t.muted;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
            onPress={() => (onSelect ? onSelect(i) : router.navigate(tab.href))}
            style={{ flex: 1, alignItems: 'center', gap: 2, paddingTop: 6 }}
          >
            <View style={{ width: 56, height: 30, borderRadius: 15, backgroundColor: on ? t.tabPill : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={tab.icon} size={24} color={color} />
            </View>
            <Txt size={10.5} weight={on ? 700 : 500} color={color}>
              {tab.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Root container for a screen: background, top safe area, optional tab bar. */
export function Screen({ children, tab, style, edgeTop = true }: { children: ReactNode; tab?: number; style?: StyleProp<ViewStyle>; edgeTop?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[{ flex: 1, paddingTop: edgeTop ? insets.top : 0 }, style]}>{children}</View>
      {tab !== undefined ? <TabBar active={tab} /> : null}
    </View>
  );
}

/** Vertical scroller with 20pt side margins. */
export function Scroll({ children, gap = 16, contentStyle, ...rest }: ScrollViewProps & { gap?: number; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingHorizontal: GUTTER, paddingBottom: 32, gap }, contentStyle]} {...rest}>
      {children}
    </ScrollView>
  );
}

/** Horizontal chip strip that bleeds to the screen edges. */
export function ChipStrip({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 2, gap: 8 }}>
      {children}
    </ScrollView>
  );
}

/** Pushed-screen top bar: chevron + parent label, optional actions on the right. */
export function BackBar({ label, onBack, right }: { label: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, paddingRight: 12 }}>
      <Press accessibilityRole="button" accessibilityLabel={`Back to ${label}`} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.navigate('/')))} style={{ height: 44, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Icon name="chevron_left" size={28} />
        <Txt size={16}>{label}</Txt>
      </Press>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{right}</View>
    </View>
  );
}

export function BarIcon({ name, onPress, color, label }: { name: IconName; onPress?: () => void; color?: string; label: string }) {
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={24} color={color} />
    </Press>
  );
}

/** Modal top bar: Cancel / Title / action. */
export function ModalBar({ title, onCancel, action, onAction, cancelLabel = 'Cancel' }: { title: string; onCancel?: () => void; action?: string; onAction?: () => void; cancelLabel?: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
      <Press accessibilityRole="button" onPress={onCancel ?? (() => router.back())} style={{ minWidth: 64, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={16} color={t.muted}>
          {cancelLabel}
        </Txt>
      </Press>
      <Txt size={17} weight={600}>
        {title}
      </Txt>
      {action ? (
        <Press accessibilityRole="button" onPress={onAction} style={{ minWidth: 64, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} weight={700} color={t.accent}>
            {action}
          </Txt>
        </Press>
      ) : (
        <View style={{ minWidth: 64 }} />
      )}
    </View>
  );
}

/** Footer pinned above the home indicator, with a top hairline. */
export function Footer({ children, line = true, style }: { children: ReactNode; line?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) + 6, borderTopWidth: line ? 1 : 0, borderTopColor: t.line, backgroundColor: t.bg }, style]}>
      {children}
    </View>
  );
}

/** Bottom sheet over a scrim. Tapping the scrim closes it. */
export function Sheet({ visible, onClose, children, height, bg }: { visible: boolean; onClose: () => void; children: ReactNode; height?: number; bg?: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.dim }} />
        <View
          style={{
            height,
            maxHeight: '92%',
            backgroundColor: bg ?? t.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: 8,
            paddingHorizontal: GUTTER,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            boxShadow: '0px -10px 30px rgba(0,0,0,0.18)',
          }}
        >
          <Grabber />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Centered-bottom dialog over a scrim, inset 12pt from the sides and 28pt from the bottom. */
export function Dialog({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Cancel" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.dim }} />
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: Math.max(insets.bottom, 0) + 28 - (insets.bottom ? 20 : 0),
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 16,
            gap: 8,
            backgroundColor: t.surface,
            borderRadius: radius.sheet,
            boxShadow: dialogShadow,
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
