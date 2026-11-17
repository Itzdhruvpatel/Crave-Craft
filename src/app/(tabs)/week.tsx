import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { DishRow, IconButton, Row, Screen, T, useLang } from '@/components/ui';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { useTheme } from '@/hooks/use-theme';
import { SLOTS, isoDate, swapDish } from '@/lib/planner.ts';
import { newWeek, setPlan, useApp, useT } from '@/state';

export default function Week() {
  const { profile, plan } = useApp();
  const t = useT();
  const c = useTheme();
  const lang = useLang();
  const locale = lang === 'en' ? 'en-IN' : `${lang}-IN`;
  const todayIso = isoDate(new Date());
  const [sel, setSel] = useState(() => Math.max(0, plan?.findIndex((d) => d.date === todayIso) ?? 0));
  const fastDays = plan?.flatMap((d, i) => (d.fast ? [i] : [])) ?? [];
  const day = plan?.[sel];

  const toggleFast = (i: number) => newWeek(fastDays.includes(i) ? fastDays.filter((x) => x !== i) : [...fastDays, i]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', paddingTop: 12 }}>
        <T kind="display">{t('thisWeek')}</T>
        <IconButton glyph="↻" label={t('regenerate')} onPress={() => newWeek(fastDays)} />
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {plan?.map((d, i) => {
          const date = new Date(`${d.date}T00:00:00`);
          const on = i === sel;
          return (
            <Pressable
              key={d.date}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setSel(i)}
              style={{
                width: 58,
                paddingVertical: 12,
                borderRadius: 20,
                alignItems: 'center',
                gap: 2,
                backgroundColor: on ? c.accent : c.backgroundElement,
                borderWidth: d.date === todayIso && !on ? 2 : 0,
                borderColor: c.accent,
              }}>
              <T kind="small" color={on ? c.accentText : c.textSecondary}>
                {date.toLocaleDateString(locale, { weekday: 'short' })}
              </T>
              <T kind="h2" color={on ? c.accentText : c.text}>
                {date.getDate()}
              </T>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.fast ? c.haldi : 'transparent' }} />
            </Pressable>
          );
        })}
      </ScrollView>

      {day && plan && (
        <>
          <T kind="title">{new Date(`${day.date}T00:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</T>

          {SLOTS.map((slot) => (
            <View key={slot} style={{ gap: 14 }}>
              <T kind="h2">{t(slot)}</T>
              {day[slot].map((id, pos) => (
                <DishRow
                  key={`${id}-${pos}`}
                  dish={DISH_BY_ID.get(id)!}
                  right={<IconButton glyph="↻" label={t('swap')} onPress={() => setPlan(swapDish(plan, sel, slot, pos, DISHES, profile!))} />}
                />
              ))}
            </View>
          ))}

          <Row style={{ backgroundColor: c.backgroundElement, borderRadius: 20, padding: 16, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T kind="label">🙏 {t('fastDay')}</T>
              <T kind="small" dim>
                {t('fastHint')}
              </T>
            </View>
            <Switch
              value={day.fast}
              onValueChange={() => toggleFast(sel)}
              trackColor={{ true: c.haldi, false: c.backgroundSelected }}
              thumbColor={c.steelHi}
            />
          </Row>
        </>
      )}
    </Screen>
  );
}
