import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { Item, Outfit } from '@/data/types';
import { radius, useTheme } from '@/theme';
import { Sheet } from './Chrome';
import { HeroCollage } from './Collage';
import { Card, Icon, Press, Toggle, Txt, type IconName } from './ui';

export function ShareSheet({ outfit, items, visible, onClose }: { outfit: Outfit; items: Item[]; visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const shot = useRef<React.ComponentRef<typeof View>>(null);
  const [names, setNames] = useState(true);
  const [copied, setCopied] = useState(false);
  const link = Linking.createURL(`/outfit/${outfit.id}`);
  const text = `${outfit.name}${names ? ` — ${items.map((x) => x.name).join(', ')}` : ''}`;

  const snapshot = () => captureRef(shot, { format: 'png', quality: 1, result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile' });

  const close = () => {
    setCopied(false);
    onClose();
  };

  const saveImage = async () => {
    try {
      const uri = await snapshot();
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = uri;
        a.download = `${outfit.name}.png`;
        a.click();
        return;
      }
      const perm = await requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Can’t save', 'Allow FitChecked to add photos in Settings.');
        return;
      }
      await Asset.create(uri);
      Alert.alert('Saved', 'The outfit image is in your photo library.');
    } catch {
      Alert.alert('Couldn’t save the image');
    }
  };

  const shareImage = async () => {
    try {
      const uri = await snapshot();
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: outfit.name, UTI: 'public.png' });
      } else {
        await Share.share({ message: `${text}\n${link}` });
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  const actions: [IconName, string, () => void][] = [
    ['download', 'Save image', saveImage],
    [copied ? 'check' : 'link', copied ? 'Copied' : 'Copy link', async () => (await Clipboard.setStringAsync(link), setCopied(true))],
    ['chat_bubble', 'Messages', () => Share.share({ message: `${text}\n${link}` }).catch(() => {})],
    ['more_horiz', 'More', shareImage],
  ];

  return (
    <Sheet visible={visible} onClose={close} bg={t.bg}>
      <View style={{ gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={17} weight={600}>
            Share outfit
          </Txt>
          <Press accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} />
          </Press>
        </View>

        <View ref={shot} collapsable={false} style={{ alignSelf: 'center', width: 220, padding: 12, gap: 10, backgroundColor: t.surface, borderRadius: radius.card, boxShadow: t.cardShadow }}>
          <HeroCollage items={items} height={170} gap={5} r={radius.small} />
          <View style={{ gap: 2, paddingHorizontal: 2 }}>
            <Txt size={15} weight={700}>
              {outfit.name}
            </Txt>
            {names ? (
              <Txt size={11} lh={1.35} color={t.muted}>
                {items.map((x) => x.name).join(' · ')}
              </Txt>
            ) : null}
            <Txt size={10.5} weight={700} color={t.accent} style={{ marginTop: 4 }}>
              FitChecked
            </Txt>
          </View>
        </View>

        <Card r={radius.small} style={{ minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: undefined }}>
          <Txt size={15} style={{ flex: 1 }}>
            Show item names
          </Txt>
          <Toggle on={names} onPress={() => setNames((v) => !v)} label="Show item names" />
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {actions.map(([icon, label, go]) => (
            <Press key={label} accessibilityRole="button" onPress={go} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 56, height: 56, borderRadius: radius.tile, backgroundColor: t.surface, boxShadow: t.cardShadow, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={24} />
              </View>
              <Txt size={12} weight={500}>
                {label}
              </Txt>
            </Press>
          ))}
        </View>
      </View>
    </Sheet>
  );
}
