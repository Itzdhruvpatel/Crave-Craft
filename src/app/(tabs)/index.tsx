import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Thali } from '@/components/thali';
import { Button, Chip, DishPhoto, DishRow, Row, Screen, T } from '@/components/ui';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { useTheme } from '@/hooks/use-theme';
import { MOOD_LABEL, nameIn } from '@/lib/i18n.ts';
import { balanceTips, fitsDiet } from '@/lib/nutrition.ts';
import { SLOTS, isoDate, type Slot } from '@/lib/planner.ts';
import type { Dish, Mood } from '@/lib/types.ts';
import { isoWeekStart, newWeek, useApp, useT } from '@/state';

const MAIN_COURSES = ['sabji', 'oneDish', 'breakfast', 'farsan'];
const MOODS: Mood[] = ['comfort', 'chatpata', 'light', 'special'];
const TITLE = { breakfast: 'thaliBreakfast', lunch: 'thaliLunch', dinner: 'thaliDinner' } as const;

function shuffle<X>(list: X[]): X[] {
  return list
    .map((x) => [Math.random(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x);
}

function slotNow(): Slot {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner';
}

export default function Today() {
  const { profile, plan } = useApp();
  const t = useT();
  const c = useTheme();
  const lang = profile!.lang;
  const [slot, setSlot] = useState<Slot>(slotNow);
  const [pick, setPick] = useState<Mood | 'tired' | 'spin' | null>(null);
  const [spinSeed, setSpinSeed] = useState(0);

  // A new Monday means a new plan.
  useEffect(() => {
    if (!plan || plan[0]?.date !== isoWeekStart()) newWeek();
  }, [plan]);

  const mine = useMemo(() => DISHES.filter((d) => fitsDiet(d, profile!.diet)), [profile]);
  const today = plan?.find((d) => d.date === isoDate(new Date()));
  const meal = today?.[slot].map((id) => DISH_BY_ID.get(id)!) ?? [];
  const tips = slot === 'breakfast' ? [] : balanceTips(meal, DISHES, profile!.diet);

  const results = useMemo((): Dish[] => {
    const pool = mine.filter((d) => MAIN_COURSES.includes(d.course));
    if (pick === 'tired') return shuffle(pool.filter((d) => d.time <= 20)).slice(0, 5);
    if (pick === 'spin') return shuffle(pool).slice(0, 1);
    if (pick) return shuffle(pool.filter((d) => d.moods.includes(pick))).slice(0, 5);
    return [];
    // spinSeed re-rolls the spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, mine, spinSeed]);

  const toggle = (p: typeof pick) => setPick(pick === p ? null : p);
  const list = results.length > 0 && (
    <View style={{ gap: 14 }}>
      {results.map((d) => (
        <DishRow key={d.id} dish={d} />
      ))}
    </View>
  );

  return (
    <Screen>
      <View style={{ gap: 6, paddingTop: 12 }}>
        <T kind="small" dim>
          {new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { weekday: 'long', day: 'numeric', month: 'long' })}
        </T>
        <T kind="display">{t(TITLE[slot])}</T>
      </View>

      <Row style={{ backgroundColor: c.backgroundElement, borderRadius: 999, padding: 4 }}>
        {SLOTS.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: slot === s }}
            onPress={() => setSlot(s)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: slot === s ? c.background : 'transparent' }}>
            <T kind="small" style={{ textAlign: 'center' }} color={slot === s ? c.text : c.textSecondary}>
              {t(s)}
            </T>
          </Pressable>
        ))}
      </Row>

      {today?.fast && (
        <View style={{ backgroundColor: c.haldi, borderRadius: 16, padding: 14 }}>
          <T kind="label" color={c.onHaldi}>
            🙏 {t('fastDay')}
          </T>
        </View>
      )}

      {meal.length ? (
        <View style={{ gap: 20 }}>
          <Thali dishes={meal} />
          <View style={{ gap: 14 }}>
            {meal.map((d) => (
              <DishRow key={d.id} dish={d} />
            ))}
          </View>
        </View>
      ) : (
        <Button label={t('newWeek')} onPress={() => newWeek()} />
      )}

      {tips.map((tip) => (
        <View key={tip.reason} style={{ backgroundColor: c.goodSoft, borderRadius: 24, padding: 18, gap: 14 }}>
          <T kind="label" color={c.good}>
            🌿 {t(tip.reason === 'protein' ? 'lowProtein' : 'lowFibre')}
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {tip.dishIds.map((id) => {
              const d = DISH_BY_ID.get(id)!;
              return (
                <Link key={id} href={{ pathname: '/dish/[id]', params: { id } }} asChild>
                  <Pressable accessibilityRole="link" style={{ width: 92, gap: 6, alignItems: 'center' }}>
                    <DishPhoto dish={d} size={72} round />
                    <T kind="small" lines={2} style={{ textAlign: 'center' }}>
                      {nameIn(d.name, lang)}
                    </T>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        </View>
      ))}

      <Row style={{ gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pick === 'tired' }}
          onPress={() => toggle('tired')}
          style={{ flex: 1, backgroundColor: c.haldi, borderRadius: 24, padding: 18, gap: 4, minHeight: 120, justifyContent: 'flex-end' }}>
          <T kind="h2" color={c.onHaldi}>
            {t('tired')}
          </T>
          <T kind="small" color={c.onHaldi}>
            {t('tiredSub')}
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pick === 'spin' }}
          onPress={() => {
            setPick('spin');
            setSpinSeed(spinSeed + 1);
          }}
          style={{ flex: 1, backgroundColor: c.text, borderRadius: 24, padding: 18, gap: 4, minHeight: 120, justifyContent: 'flex-end' }}>
          <T kind="h2" color={c.background}>
            {t('spinTitle')}
          </T>
          <T kind="small" color={c.background}>
            {t('spinSub')}
          </T>
        </Pressable>
      </Row>

      {(pick === 'tired' || pick === 'spin') && list}

      <View style={{ gap: 12 }}>
        <T kind="h2">{t('whatMood')}</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {MOODS.map((m) => (
            <Chip key={m} label={nameIn(MOOD_LABEL[m], lang)} on={pick === m} onPress={() => toggle(m)} />
          ))}
        </ScrollView>
      </View>

      {pick !== 'tired' && pick !== 'spin' && list}
    </Screen>
  );
}
