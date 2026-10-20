import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { CaptureFrame } from '@/components/CaptureFrame';
import { Button, H2, Icon, IconCircle, Txt } from '@/components/ui';
import { useStore } from '@/data/store';
import { finishCapture } from '@/lib/capture';
import { radius, useTheme } from '@/theme';

export default function UploadFailed() {
  const t = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const capture = useStore((s) => s.capture);
  const params = isEdit ? { edit: '1' } : {};

  return (
    <CaptureFrame
      footer={
        <View style={{ gap: 10 }}>
          <Button label="Try again" icon="refresh" onPress={() => router.replace({ pathname: '/processing', params })} />
          <Button label="Use photo as is" kind="secondary" onPress={() => finishCapture(isEdit)} />
          <Button label="Retake photo" kind="text" height={40} size={15} onPress={() => router.replace({ pathname: '/camera', params })} />
        </View>
      }
    >
      <View style={{ height: 260, borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#4b433c' }}>
        {capture ? <Image source={{ uri: capture.originalUri }} contentFit="cover" style={{ flex: 1 }} /> : null}
        <View style={{ position: 'absolute', left: 12, top: 12, height: 30, paddingHorizontal: 10, borderRadius: radius.chip, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="check" size={16} />
          <Txt size={12.5} weight={600}>
            Photo saved
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <IconCircle name="cloud_off" size={40} color={t.danger} />
        <View style={{ flex: 1, gap: 4 }}>
          <H2>Couldn't remove the background</H2>
          <Txt size={14} lh={1.45} color={t.muted}>
            The connection dropped while processing. Your photo is saved on this phone, so nothing is lost.
          </Txt>
        </View>
      </View>
    </CaptureFrame>
  );
}
