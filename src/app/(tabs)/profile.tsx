import { router } from 'expo-router';
import { useState } from 'react';
import { Share, TextInput, View } from 'react-native';

import { Dialog, Scroll, Screen } from '@/components/Chrome';
import { Button, Card, H1, H2, Icon, Label, Press, Row, Segmented, Toggle, Txt, type IconName } from '@/components/ui';
import { useItems, useOutfits, useStore } from '@/data/store';
import type { Appearance } from '@/data/types';
import { fromKey, monthName } from '@/lib/dates';
import { radius, useTheme } from '@/theme';
import { family } from '@/theme/fonts';

type R = { icon: IconName; l: string; v?: string; onPress?: () => void; toggle?: boolean; on?: boolean; seg?: boolean };

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const TIMES = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

export default function Profile() {
  const t = useTheme();
  const items = useItems();
  const outfits = useOutfits();
  const tagGroups = useStore((s) => s.tagGroups);
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const name = useStore((s) => s.profileName);
  const since = useStore((s) => s.memberSince);
  const setName = useStore((s) => s.setProfileName);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const tagCount = tagGroups.reduce((n, g) => n + g.tags.length, 0);
  const initials = (name || 'You').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const exportCloset = () => {
    const { items: it, outfits: of, log, tagGroups: tg } = useStore.getState();
    Share.share({ title: 'FitChecked closet', message: JSON.stringify({ items: it, outfits: of, log, tags: tg }, null, 2) }).catch(() => {});
  };

  const sections: [string, R[]][] = [
    [
      'Weather',
      [
        { icon: 'location_on', l: 'Location', v: settings.place?.name ?? 'Not set', onPress: () => router.push('/location') },
        { icon: 'thermostat', l: 'Units', v: `°${settings.units}`, onPress: () => update({ units: settings.units === 'C' ? 'F' : 'C' }) },
      ],
    ],
    [
      'Suggestions',
      [
        { icon: 'wb_twilight', l: 'Morning suggestion', toggle: true, on: settings.morningSuggestion, onPress: () => update({ morningSuggestion: !settings.morningSuggestion }) },
        {
          icon: 'schedule',
          l: 'Time',
          v: settings.morningSuggestion ? fmtTime(settings.morningTime) : 'Off',
          onPress: settings.morningSuggestion ? () => update({ morningTime: TIMES[(TIMES.indexOf(settings.morningTime) + 1) % TIMES.length] }) : undefined,
        },
        { icon: 'history', l: 'Skip recently worn', v: `${settings.skipRecentDays} days`, onPress: () => update({ skipRecentDays: settings.skipRecentDays >= 7 ? 3 : settings.skipRecentDays + 2 }) },
      ],
    ],
    [
      'Closet',
      [
        { icon: 'sell', l: 'Tags', v: String(tagCount), onPress: () => router.push('/tags') },
        { icon: 'category', l: 'Categories', v: '5' },
      ],
    ],
    ['Appearance', [{ icon: 'contrast', l: 'Theme', seg: true }]],
    [
      'Data',
      [
        { icon: 'ios_share', l: 'Export closet', onPress: exportCloset },
        { icon: 'smartphone', l: 'Storage', v: 'On this device' },
      ],
    ],
  ];

  const sinceDate = fromKey(since);

  return (
    <Screen>
      <Scroll gap={18} contentStyle={{ paddingTop: 4 }}>
        <View style={{ gap: 4 }}>
          <Label>Settings</Label>
          <H1>Profile</H1>
        </View>
        <Card onPress={() => (setDraftName(name), setEditing(true))} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={18} weight={700} color={t.onAccent}>
              {initials}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={17} weight={600}>
              {name || 'Add your name'}
            </Txt>
            <Txt size={13} color={t.muted}>
              {`${items.length} items · ${outfits.length} outfits · since ${monthName(sinceDate.getMonth())}`}
            </Txt>
          </View>
          <Icon name="edit" size={20} color={t.muted} />
        </Card>

        {sections.map(([title, rows]) => (
          <View key={title} style={{ gap: 8 }}>
            <Label style={{ paddingHorizontal: 4 }}>{title}</Label>
            <Card style={{ overflow: 'hidden' }}>
              {rows.map((r, i) => (
                <Row key={r.l} first={i === 0} onPress={r.toggle || r.seg ? undefined : r.onPress}>
                  <View style={{ width: 32, height: 32, borderRadius: radius.small, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={r.icon} size={19} />
                  </View>
                  <Txt size={15} style={{ flex: 1 }}>
                    {r.l}
                  </Txt>
                  {r.toggle ? <Toggle on={!!r.on} onPress={r.onPress} label={r.l} /> : null}
                  {r.seg ? (
                    <Segmented<Appearance>
                      options={[
                        ['system', 'Auto'],
                        ['light', 'Light'],
                        ['dark', 'Dark'],
                      ]}
                      value={settings.appearance}
                      onChange={(appearance) => update({ appearance })}
                    />
                  ) : null}
                  {!r.toggle && !r.seg ? (
                    <>
                      {r.v ? (
                        <Txt size={14} color={t.muted}>
                          {r.v}
                        </Txt>
                      ) : null}
                      <Icon name="chevron_right" size={20} color={t.muted} style={{ marginRight: -4 }} />
                    </>
                  ) : null}
                </Row>
              ))}
            </Card>
          </View>
        ))}
        <Txt size={12} color={t.muted} style={{ textAlign: 'center' }}>
          FitChecked 1.0 · Your closet stays on this phone
        </Txt>
      </Scroll>

      <Dialog visible={editing} onClose={() => setEditing(false)}>
        <H2>Your name</H2>
        <Txt size={14.5} lh={1.45} color={t.muted}>
          Used for your morning greeting.
        </Txt>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          autoFocus
          placeholder="Name"
          placeholderTextColor={t.muted}
          style={{ marginTop: 8, height: 50, borderRadius: radius.button, borderWidth: 1, borderColor: t.inBd, backgroundColor: t.inBg, paddingHorizontal: 14, fontSize: 16, fontFamily: family[600], color: t.ink }}
        />
        <Button style={{ marginTop: 12 }} height={52} label="Save" onPress={() => (setName(draftName.trim()), setEditing(false))} />
        <Press onPress={() => setEditing(false)} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} weight={600}>
            Cancel
          </Txt>
        </Press>
      </Dialog>
    </Screen>
  );
}
