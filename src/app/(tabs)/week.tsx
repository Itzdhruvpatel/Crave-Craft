import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View, useWindowDimensions } from 'react-native';

import { Stepper } from '@/components/stepper';
import { C, Circle, DishPhoto, Glass, Headline, IconPill, Row, Screen, T, TopBar, photoOf, useLang } from '@/components/ui';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { fastsOn } from '@/lib/fasts.ts';
import { isOily } from '@/lib/health.ts';
import { weekReport, type Light } from '@/lib/nutrition.ts';
import { nameIn, type StrKey } from '@/lib/i18n.ts';
import { SLOTS, isoDate, swapDish } from '@/lib/planner.ts';
import { newWeek, setGuests, setPlan, useApp, useT } from '@/state';

const HERO = ['sabji', 'oneDish', 'breakfast', 'farsan'];
const LIGHT: Record<Light, string> = { green: '#7BE07B', amber: '#FFC15A', red: '#FF6B6B' };

export default function Week() {
  const { profile, plan } = useApp();
  const t = useT();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const locale = lang === 'en' ? 'en-IN' : `${lang}-IN`;
  const todayIso = isoDate(new Date());
  const [sel, setSel] = useState(() => Math.max(0, plan?.findIndex((d) => d.date === todayIso) ?? 0));
  const [active, setActive] = useState(0);
  const fastDays = plan?.flatMap((d, i) => (d.fast ? [i] : [])) ?? [];
  const day = plan?.[sel];
  const cardW = Math.min(width - 40, 520) * 0.74;

  const toggleFast = (i: number) => newWeek(fastDays.includes(i) ? fastDays.filter((x) => x !== i) : [...fastDays, i]);
  const heroId = day?.lunch.find((id) => HERO.includes(DISH_BY_ID.get(id)!.course)) ?? day?.lunch[0];

  return (
    <Screen photo={photoOf(heroId)}>
      <TopBar
        left={<Circle icon="chevron-back" label={t('back')} onPress={() => router.navigate('/')} />}
        title={t('thisWeek')}
        right={
          <IconPill>
            <Circle icon="refresh" label={t('regenerate')} kind="glass" size={40} onPress={() => newWeek(fastDays)} />
            <Circle icon="briefcase-outline" label={`${t('tiffinA')} ${t('tiffinB')}`} kind="glass" size={40} onPress={() => router.push('/tiffin')} />
            <Circle icon="cart-outline" label={`${t('groceryA')} ${t('groceryB')}`} size={40} onPress={() => router.push('/grocery')} />
          </IconPill>
        }
      />

      <Headline a={t('weekA')} b={t('weekB')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {plan?.map((d, i) => {
          const date = new Date(`${d.date}T00:00:00`);
          const on = i === sel;
          const body = (
            <View style={{ width: 54, paddingVertical: 12, alignItems: 'center', gap: 2 }}>
              <T kind="tiny" color={on ? C.ink : C.textSecondary}>
                {date.toLocaleDateString(locale, { weekday: 'short' })}
              </T>
              <T kind="h2" color={on ? C.ink : C.text}>
                {date.getDate()}
              </T>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: d.fast ? (on ? C.ink : C.accent) : d.date === todayIso ? C.textSecondary : 'transparent' }} />
            </View>
          );
          return (
            <Pressable key={d.date} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setSel(i)}>
              {on ? <View style={{ borderRadius: 22, backgroundColor: C.accent }}>{body}</View> : <Glass radius={22}>{body}</Glass>}
            </Pressable>
          );
        })}
      </ScrollView>

      <T dim>
        {day ? new Date(`${day.date}T00:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        {day?.justice ? `  ·  ⚖️ ${t('justiceBadge')}` : ''}
        {day ? fastsOn(new Date(`${day.date}T00:00:00`), profile?.fasts ?? []).map((f) => `  ·  🙏 ${t(`fast_${f}` as StrKey)}`).join('') : ''}
      </T>

      {day && plan && (
        <View style={{ marginHorizontal: -20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardW + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            onScroll={(e) => setActive(Math.max(0, Math.min(2, Math.round(e.nativeEvent.contentOffset.x / (cardW + 12)))))}
            scrollEventThrottle={32}>
            {SLOTS.map((slot, si) => {
              const on = si === active;
              return (
                <Glass key={slot} strong={on} style={{ width: cardW, padding: 20, gap: 16, minHeight: 280 }}>
                  <T kind="title" weight={on ? 600 : 300}>
                    {t(slot)}
                  </T>
                  {day[slot].map((id, pos) => {
                    const d = DISH_BY_ID.get(id)!;
                    return (
                      <Row key={`${id}-${pos}`} style={{ gap: 12 }}>
                        <Link href={{ pathname: '/dish/[id]', params: { id } }} asChild>
                          <Pressable accessibilityRole="link" style={{ flex: 1 }}>
                            <Row style={{ gap: 12 }}>
                              <DishPhoto dish={d} size={46} round />
                              <T kind="label" lines={2} style={{ flex: 1 }}>
                                {nameIn(d.name, lang)}
                              </T>
                            </Row>
                          </Pressable>
                        </Link>
                        <Circle
                          icon="swap-horizontal"
                          label={t('swap')}
                          kind={on ? 'lime' : 'glass'}
                          size={38}
                          onPress={() => setPlan(swapDish(plan, sel, slot, pos, DISHES, profile!))}
                        />
                      </Row>
                    );
                  })}
                </Glass>
              );
            })}
          </ScrollView>
        </View>
      )}

      {day && (
        <Glass style={{ padding: 18 }}>
          <Row style={{ gap: 14 }}>
            <Circle icon="moon-outline" label={t('fastDay')} kind={day.fast ? 'lime' : 'glass'} size={40} />
            <View style={{ flex: 1 }}>
              <T kind="label">{t('fastDay')}</T>
              <T kind="small" dim>
                {t('fastHint')}
              </T>
            </View>
            <Switch
              value={day.fast}
              onValueChange={() => toggleFast(sel)}
              trackColor={{ true: C.accent, false: 'rgba(255,255,255,0.2)' }}
              thumbColor={C.white}
              accessibilityLabel={t('fastDay')}
            />
          </Row>
        </Glass>
      )}

      {plan && (
        <Glass style={{ padding: 18, gap: 12 }}>
          <T kind="h2">{t('weekCheck')}</T>
          {(() => {
            const r = weekReport(plan, DISH_BY_ID, isOily);
            const rows = [
              ['wk_protein', `${r.protein.value} g`, r.protein.light],
              ['wk_veggies', `${r.veggies.value} / 7`, r.veggies.light],
              ['wk_fried', String(r.fried.value), r.fried.light],
              ['wk_outside', String(r.outside.value), r.outside.light],
            ] as const;
            return rows.map(([key, value, light]) => (
              <Row key={key} style={{ gap: 12 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: LIGHT[light] }} />
                <T style={{ flex: 1 }}>{t(key)}</T>
                <T kind="label">{value}</T>
              </Row>
            ));
          })()}
        </Glass>
      )}

      {day && (
        <Glass style={{ padding: 18 }}>
          <Row style={{ gap: 14 }}>
            <Circle icon="people-outline" label={t('guests')} kind={day.guests ? 'lime' : 'glass'} size={40} />
            <View style={{ flex: 1 }}>
              <T kind="label">{t('guests')}</T>
              <T kind="small" dim>
                {t('guestsHint')}
              </T>
            </View>
            <Stepper value={day.guests ?? 0} min={0} max={30} onChange={(n) => setGuests(day.date, n)} />
          </Row>
        </Glass>
      )}
    </Screen>
  );
}
