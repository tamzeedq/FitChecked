import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { OnbCopy, OnbFrame } from '@/components/Onboarding';
import { Button, Card, Icon, IconCircle, Txt } from '@/components/ui';
import { useStore } from '@/data/store';
import { pickFromGallery } from '@/lib/capture';
import { useTheme } from '@/theme';

export default function FirstItems() {
  const t = useTheme();
  const place = useStore((s) => s.settings.place);
  const complete = useStore((s) => s.completeOnboarding);
  const loadSample = useStore((s) => s.loadSampleCloset);

  // Leaving onboarding swaps the protected routes in, then we can open the next screen.
  const finish = (then?: Href | (() => void)) => {
    complete();
    if (!then) return;
    setTimeout(() => (typeof then === 'function' ? then() : router.push(then)), 0);
  };

  const starts = [
    { icon: 'photo_camera', n: 'Take a photo', sub: 'Fastest way to add a piece', go: () => finish('/camera') },
    { icon: 'photo_library', n: 'Choose from gallery', sub: 'Use photos you already have', go: () => finish(() => pickFromGallery()) },
    {
      icon: 'checkroom',
      n: 'Explore a sample closet',
      sub: 'Try the app first, add yours later',
      go: () => {
        loadSample();
        finish();
      },
    },
  ];

  return (
    <OnbFrame
      step={3}
      right={
        <Txt size={13} color={t.muted}>
          {place ? `Weather: ${place.name}` : 'Weather: not set'}
        </Txt>
      }
      footer={
        <>
          <Button label="Add my first item" icon="photo_camera" onPress={() => finish('/camera')} />
          <Button label="I'll do this later" kind="text" height={48} size={15} onPress={() => finish()} />
        </>
      }
    >
      <OnbCopy style={{ marginTop: 18 }} eyebrow="Step 3 of 3 · Closet" title="Start with five pieces you wear most" body="A plain photo is enough. Each item takes about 20 seconds." />
      <View style={{ marginTop: 26, gap: 12 }}>
        {starts.map((s) => (
          <Card key={s.n} onPress={s.go} style={{ minHeight: 76, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconCircle name={s.icon} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={16} weight={600}>
                {s.n}
              </Txt>
              <Txt size={13} color={t.muted}>
                {s.sub}
              </Txt>
            </View>
            <Icon name="chevron_right" color={t.muted} />
          </Card>
        ))}
      </View>
    </OnbFrame>
  );
}
