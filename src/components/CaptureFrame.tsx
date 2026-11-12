import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useStore } from '@/data/store';
import { GUTTER } from '@/theme';
import { Footer, ModalBar, Screen } from './Chrome';

/** Shared shell for the processing and upload-failed steps. */
export function CaptureFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const setCapture = useStore((s) => s.setCapture);
  return (
    <Screen>
      <ModalBar
        title="New item"
        onCancel={() => {
          setCapture(null);
          router.back();
        }}
      />
      <View style={{ flex: 1, gap: 20, paddingHorizontal: GUTTER, paddingTop: 4 }}>{children}</View>
      {footer ? <Footer line={false}>{footer}</Footer> : null}
    </Screen>
  );
}
