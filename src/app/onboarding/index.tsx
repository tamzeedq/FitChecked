import { router } from 'expo-router';
import { useMemo } from 'react';

import { HeroCollage } from '@/components/Collage';
import { OnbCopy, OnbFrame } from '@/components/Onboarding';
import { Button } from '@/components/ui';
import { buildSampleCloset } from '@/data/sample';

export default function Welcome() {
  const hero = useMemo(() => {
    const { items } = buildSampleCloset();
    const by = (id: string) => items.find((x) => x.id === `sample-${id}`)!;
    return ['jacket', 'sweater', 'sneakers', 'jeans'].map(by);
  }, []);

  return (
    <OnbFrame step={1} footer={<Button label="Get started" onPress={() => router.push('/onboarding/location')} />}>
      <HeroCollage items={hero} height={300} style={{ marginTop: 10 }} />
      <OnbCopy
        eyebrow="Welcome to FitChecked"
        title="Your whole closet, in your pocket"
        body="Save what you own, build outfits, and get a suggestion each morning that fits the weather."
      />
    </OnbFrame>
  );
}
