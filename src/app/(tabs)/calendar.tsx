import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Screen } from '@/components/Chrome';
import { MiniCollage } from '@/components/Collage';
import { EmptyTile, Garment } from '@/components/Garment';
import { Button, Grabber, H1, H2, Icon, Label, Press, Segmented, Txt } from '@/components/ui';
import { cap, itemMap, outfitItems, useStore } from '@/data/store';
import type { Item } from '@/data/types';
import { addDays, dateKey, fromKey, longDate, mondayIndex, monthName, todayKey } from '@/lib/dates';
import { GUTTER, radius, useTheme } from '@/theme';

function Thumb({ item, size }: { item?: Item; size: number }) {
  if (!item) return null;
  return (
    <View style={{ width: size, height: size }}>
      <Garment item={item} r={radius.mini} mini />
    </View>
  );
}

export default function Calendar() {
  const t = useTheme();
  const params = useLocalSearchParams<{ day?: string; week?: string }>();
  const log = useStore((s) => s.log);
  const outfits = useStore((s) => s.outfits);
  const items = itemMap(useStore((s) => s.items));
  const tKey = todayKey();

  const [selected, setSelected] = useState(params.day ?? tKey);
  const [week, setWeek] = useState(params.week === '1');
  const [cursor, setCursor] = useState(() => fromKey(params.day ?? tKey));
  const [panelH, setPanelH] = useState(180);

  // Follow new route params (e.g. a day tapped on Home) without an effect.
  const [seen, setSeen] = useState(`${params.day}|${params.week}`);
  if (seen !== `${params.day}|${params.week}`) {
    setSeen(`${params.day}|${params.week}`);
    if (params.day) {
      setSelected(params.day);
      setCursor(fromKey(params.day));
    }
    if (params.week) setWeek(params.week === '1');
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const outfitById = useMemo(() => new Map(outfits.map((o) => [o.id, o])), [outfits]);
  const firstPiece = (oid: string) => outfitItems(outfitById.get(oid), items)[0];

  // Monday-first grid for the month, or one week around the cursor.
  const cells = useMemo(() => {
    if (week) {
      const mon = addDays(cursor, -mondayIndex(cursor));
      return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    }
    const first = new Date(year, month, 1);
    const lead = mondayIndex(first);
    const days = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((lead + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const n = i - lead + 1;
      return n < 1 || n > days ? null : new Date(year, month, n);
    });
  }, [week, cursor, year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const elapsed = tKey.startsWith(monthPrefix) ? Number(tKey.slice(8)) : tKey > monthPrefix ? new Date(year, month + 1, 0).getDate() : 0;
  const loggedCount = Object.keys(log).filter((k) => k.startsWith(monthPrefix) && k <= tKey).length;

  const shift = (dir: 1 | -1) => setCursor((c) => (week ? addDays(c, 7 * dir) : new Date(c.getFullYear(), c.getMonth() + dir, 1)));

  const dayLogs = (log[selected] ?? []).filter((id) => outfitById.has(id));
  const isFuture = selected > tKey;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: panelH + 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <Label>{elapsed ? `${loggedCount} of ${elapsed} days logged` : 'Upcoming'}</Label>
            <H1>{year === new Date().getFullYear() ? monthName(month) : `${monthName(month)} ${year}`}</H1>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['chevron_left', 'chevron_right'] as const).map((ic, i) => (
              <Press key={ic} accessibilityRole="button" accessibilityLabel={i ? 'Next' : 'Previous'} onPress={() => shift(i ? 1 : -1)} style={{ width: 44, height: 44, borderRadius: radius.button, backgroundColor: t.btn2Bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ic} size={22} color={t.btn2Ink} />
              </Press>
            ))}
          </View>
        </View>

        <Segmented
          fill
          height={34}
          options={[
            ['month', 'Month'],
            ['week', 'Week'],
          ]}
          value={week ? 'week' : 'month'}
          onChange={(v) => {
            setWeek(v === 'week');
            setCursor(fromKey(selected));
          }}
        />

        <View style={{ flexDirection: 'row', gap: 4 }}>
          {'MTWTFSS'.split('').map((d, i) => (
            <Txt key={i} size={11} weight={600} color={t.muted} style={{ flex: 1, textAlign: 'center' }}>
              {d}
            </Txt>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 }}>
          {cells.map((d, i) => {
            const w = `${100 / 7}%` as const;
            if (!d) return <View key={`b${i}`} style={{ width: w, height: 56 }} />;
            const key = dateKey(d);
            const logs = (log[key] ?? []).filter((id) => outfitById.has(id));
            const sel = key === selected;
            const isToday = key === tKey;
            const ink = sel ? t.selInk : key > tKey ? t.muted : t.ink;
            return (
              <View key={key} style={{ width: w, paddingHorizontal: 2 }}>
                <Press
                  accessibilityLabel={longDate(d)}
                  onPress={() => setSelected(key)}
                  style={{
                    height: 56,
                    borderRadius: radius.small,
                    backgroundColor: sel ? t.selBg : 'transparent',
                    borderWidth: isToday && !sel ? 1.5 : 0,
                    borderColor: t.today,
                    alignItems: 'center',
                    gap: 3,
                    paddingTop: 4,
                  }}
                >
                  <Txt size={11.5} weight={isToday || sel ? 700 : 500} color={ink}>
                    {d.getDate()}
                  </Txt>
                  {logs.length === 1 ? <Thumb item={firstPiece(logs[0])} size={30} /> : null}
                  {logs.length >= 2 ? (
                    <>
                      <View style={{ width: 34, height: 30 }}>
                        <View style={{ position: 'absolute', right: 0, top: 0 }}>
                          <Thumb item={firstPiece(logs[1])} size={26} />
                        </View>
                        <View style={{ position: 'absolute', left: 0, bottom: 0, borderRadius: radius.mini + 1.5, borderWidth: 1.5, borderColor: sel ? t.selBg : t.bg }}>
                          <Thumb item={firstPiece(logs[0])} size={26} />
                        </View>
                      </View>
                      <View style={{ position: 'absolute', top: 2, right: 1, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                        <Txt size={9.5} weight={700} color={t.onAccent}>
                          {logs.length}
                        </Txt>
                      </View>
                    </>
                  ) : null}
                  {!logs.length && key <= tKey ? <EmptyTile size={26} color={sel ? t.selInk : t.line} /> : null}
                </Press>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Day sheet: what was worn on the selected day. */}
      <View
        onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 8,
          paddingHorizontal: GUTTER,
          paddingBottom: 14,
          gap: 10,
          backgroundColor: t.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          boxShadow: '0px -10px 30px -12px rgba(0,0,0,0.22)',
        }}
      >
        <Grabber />
        <View style={{ gap: 2 }}>
          <H2 size={19}>{longDate(fromKey(selected))}</H2>
          <Txt size={12.5} color={t.muted}>
            {dayLogs.length ? `${dayLogs.length} outfit${dayLogs.length > 1 ? 's' : ''} logged` : isFuture ? 'Upcoming' : 'Nothing logged'}
          </Txt>
        </View>
        {dayLogs.map((oid, i) => {
          const o = outfitById.get(oid)!;
          return (
            <Press key={oid} onPress={() => router.push(`/outfit/${oid}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
              <MiniCollage items={outfitItems(o, items)} size={52} />
              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <Txt size={15} weight={600} numberOfLines={1}>
                  {o.name}
                </Txt>
                <Txt size={12.5} color={t.muted} numberOfLines={1}>
                  {o.tags.map(cap).join(' · ') || 'No tags'}
                </Txt>
              </View>
              <Txt size={12} color={t.muted}>
                {dayLogs.length > 1 ? (i ? 'Evening' : 'Morning') : 'All day'}
              </Txt>
            </Press>
          );
        })}
        {!dayLogs.length ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
              <View style={{ width: 52, height: 52, borderRadius: radius.small, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.muted, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="checkroom" color={t.muted} />
              </View>
              <Txt size={13.5} lh={1.4} color={t.muted} style={{ flex: 1 }}>
                {isFuture ? 'Planning outfits ahead is coming later.' : 'No outfit logged. Logging helps suggestions avoid repeats.'}
              </Txt>
            </View>
            {!isFuture ? <Button label="Log an outfit" icon="add" height={46} size={15} iconSize={19} onPress={() => router.push({ pathname: '/log', params: { day: selected } })} /> : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
