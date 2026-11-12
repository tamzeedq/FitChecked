import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Press, Txt } from '@/components/ui';
import { pickFromGallery, startProcessing } from '@/lib/capture';

// The camera is always black, whatever the theme.
const BLACK = '#0b0b0b';
const WHITE = '#ffffff';

export default function Camera() {
  const insets = useSafeAreaInsets();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const [permission, requestPermission] = useCameraPermissions({ request: true });
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const cam = useRef<CameraView>(null);

  const close = () => (router.canGoBack() ? router.back() : router.navigate('/closet'));

  const shoot = async () => {
    if (busy || !cam.current) return;
    setBusy(true);
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.85 });
      if (pic?.uri) startProcessing(pic.uri, { replace: true, edit: isEdit });
    } catch {
      Alert.alert('Couldn’t take the photo', 'Try again, or choose one from your gallery.');
    } finally {
      setBusy(false);
    }
  };

  const help = () =>
    Alert.alert('Photo tips', 'Lay the piece flat on a plain, contrasting surface in good light. Fill the frame and keep the whole garment inside the guide.');

  const granted = permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: BLACK, paddingTop: insets.top }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <Press accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={26} color={WHITE} />
        </Press>
        <Txt size={16} weight={600} color={WHITE}>
          Add item
        </Txt>
        <Press accessibilityRole="button" accessibilityLabel={flash ? 'Flash on' : 'Flash off'} onPress={() => setFlash((f) => !f)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={flash ? 'flash_on' : 'flash_off'} size={24} color={WHITE} />
        </Press>
      </View>

      <View style={{ flex: 1, marginHorizontal: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: '#4b433c', alignItems: 'center', justifyContent: 'center' }}>
        {granted ? (
          <CameraView ref={cam} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} facing="back" flash={flash ? 'on' : 'off'} />
        ) : permission ? (
          <View style={{ padding: 28, gap: 14, alignItems: 'center' }}>
            <Txt size={16} weight={600} color={WHITE} style={{ textAlign: 'center' }}>
              Allow camera access to photograph your clothes
            </Txt>
            {permission.canAskAgain ? <Button label="Allow camera" onPress={requestPermission} height={48} /> : <Txt color={WHITE} style={{ textAlign: 'center', opacity: 0.8 }}>Turn on camera access for FitChecked in Settings, or pick a photo from your gallery.</Txt>}
          </View>
        ) : null}
        {granted ? (
          <>
            <View pointerEvents="none" style={{ position: 'absolute', top: 64, left: 28, right: 28, bottom: 40, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 20 }} />
            <View pointerEvents="none" style={{ position: 'absolute', top: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Txt size={13.5} weight={600} color={WHITE}>
                Lay it flat on a plain surface
              </Txt>
            </View>
          </>
        ) : null}
      </View>

      <View style={{ height: 150, paddingHorizontal: 36, paddingBottom: Math.max(insets.bottom, 24), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press accessibilityRole="button" accessibilityLabel="Choose from gallery" onPress={() => pickFromGallery({ replace: true, edit: isEdit })} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="photo_library" size={24} color={WHITE} />
        </Press>
        <Press accessibilityRole="button" accessibilityLabel="Take photo" disabled={!granted || busy} onPress={shoot} style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: WHITE, alignItems: 'center', justifyContent: 'center', opacity: granted ? 1 : 0.4 }}>
          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: WHITE }} />
        </Press>
        <Press accessibilityRole="button" accessibilityLabel="Help" onPress={help} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="help" size={24} color={WHITE} />
        </Press>
      </View>
    </View>
  );
}
