import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, View } from 'react-native';

import { CaptureFrame } from '@/components/CaptureFrame';
import { Card, H2, Icon, Txt } from '@/components/ui';
import { useStore } from '@/data/store';
import { finishCapture } from '@/lib/capture';
import { NotConfiguredError, removeBackground } from '@/lib/photos';
import { radius, useTheme } from '@/theme';

type Step = 'done' | 'now' | 'todo';

export default function Processing() {
  const t = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const capture = useStore((s) => s.capture);
  const setCapture = useStore((s) => s.setCapture);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const scan = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(320);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scan]);

  useEffect(() => {
    if (!capture) {
      router.back();
      return;
    }
    let live = true;
    (async () => {
      try {
        const result = await removeBackground(capture.originalUri);
        if (!live) return;
        setPhase(1);
        setCapture(result);
        setPhase(2);
        setTimeout(() => live && finishCapture(isEdit), 400);
      } catch (e) {
        if (!live) return;
        if (e instanceof NotConfiguredError) {
          // No service configured: keep the original photo and move on.
          setPhase(2);
          setTimeout(() => live && finishCapture(isEdit), 500);
        } else {
          router.replace({ pathname: '/upload-failed', params: isEdit ? { edit: '1' } : {} });
        }
      }
    })();
    return () => {
      live = false;
    };
    // Run once per photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture?.originalUri]);

  const steps: [string, Step][] = [
    ['Photo saved', 'done'],
    ['Removing background', phase >= 1 ? 'done' : 'now'],
    ['Suggesting category and color', phase >= 2 ? 'done' : phase === 1 ? 'now' : 'todo'],
  ];

  return (
    <CaptureFrame>
      <View onLayout={(e) => setH(e.nativeEvent.layout.height)} style={{ height: 320, borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#4b433c' }}>
        {capture ? <Image source={{ uri: capture.originalUri }} contentFit="cover" style={{ flex: 1 }} /> : null}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: scan.interpolate({ inputRange: [0, 1], outputRange: [h * 0.1, h * 0.9] }),
            backgroundColor: 'rgba(125,114,104,0.35)',
            borderBottomWidth: 2,
            borderBottomColor: t.accent,
            boxShadow: `0px 6px 18px -4px ${t.accent}`,
          }}
        />
      </View>
      <View style={{ gap: 6 }}>
        <H2>Getting your photo ready</H2>
        <Txt size={14} color={t.muted}>
          Usually takes a few seconds. You can edit everything next.
        </Txt>
      </View>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
        {steps.map(([l, s]) => (
          <View key={l} style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 22, alignItems: 'center' }}>
              {s === 'done' ? <Icon name="check_circle" size={22} color={t.accent} /> : s === 'now' ? <ActivityIndicator size="small" color={t.accent} /> : <Icon name="radio_button_unchecked" size={22} color={t.muted} />}
            </View>
            <Txt size={15} weight={s === 'now' ? 600 : 500} color={s === 'todo' ? t.muted : t.ink}>
              {l}
            </Txt>
          </View>
        ))}
      </Card>
    </CaptureFrame>
  );
}
