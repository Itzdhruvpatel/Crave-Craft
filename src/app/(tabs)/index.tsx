import * as Speech from 'expo-speech';
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, C, Chip, Circle, DishPhoto, DishRow, Glass, Headline, IconPill, Row, Screen, T, TopBar, minutes, photoOf } from '@/components/ui';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { COURSE_LABEL, MOOD_LABEL, SPEECH_LANG, ingName, nameIn } from '@/lib/i18n.ts';
import { balanceTips, fitsDiet } from '@/lib/nutrition.ts';
import { ingredient } from '@/lib/scale.ts';
import { SLOTS, isoDate, type Slot } from '@/lib/planner.ts';
import { streak } from '@/lib/streak.ts';
import type { Dish, Mood, Rating } from '@/lib/types.ts';
import { isoWeekStart, newWeek, rate, sayThanks, useApp, useT } from '@/state';

const MAIN_COURSES = ['sabji', 'oneDish', 'breakfast', 'farsan'];
const MOODS: Mood[] = ['comfort', 'chatpata', 'light', 'special'];
const FACES: [Rating, string, 'loved' | 'okay' | 'meh'][] = [[1, '😋', 'loved'], [0, '🙂', 'okay'], [-1, '😐', 'meh']];
const TITLE_A = { breakfast: 'breakfastA', lunch: 'lunchA', dinner: 'dinnerA' } as const;
const TITLE_B = { breakfast: 'breakfastB', lunch: 'lunchB', dinner: 'dinnerB' } as const;

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

/** The dish a meal is about: the sabji or one-dish meal, not the rotli. */
function heroOf(meal: Dish[]): number {
  return Math.max(0, meal.findIndex((d) => MAIN_COURSES.includes(d.course)));
}

export default function Today() {
  const { profile, plan, thanks } = useApp();
  const t = useT();
  const lang = profile!.lang;
  const [slot, setSlot] = useState<Slot>(slotNow);
  const [focus, setFocus] = useState<number | null>(null);
  const [pick, setPick] = useState<Mood | 'tired' | 'spin' | null>(null);
  const [roll, setRoll] = useState(0);

  // A new Monday means a new plan.
  useEffect(() => {
    if (!plan || plan[0]?.date !== isoWeekStart()) newWeek();
  }, [plan]);
  useEffect(() => () => void Speech.stop(), []);

  const mine = useMemo(() => DISHES.filter((d) => fitsDiet(d, profile!.diet)), [profile]);
  const today = plan?.find((d) => d.date === isoDate(new Date()));
  const meal = today?.[slot].map((id) => DISH_BY_ID.get(id)!) ?? [];
  const at = focus ?? heroOf(meal);
  const dish = meal[at];
  const thankedToday = thanks.includes(isoDate(new Date()));
  const days = streak(thanks, new Date());
  const tips = slot === 'breakfast' ? [] : balanceTips(meal, DISHES, profile!);

  const results = useMemo((): Dish[] => {
    const pool = mine.filter((d) => MAIN_COURSES.includes(d.course));
    if (pick === 'tired') return shuffle(pool.filter((d) => d.time <= 20)).slice(0, 4);
    if (pick === 'spin') return shuffle(pool).slice(0, 1);
    if (pick) return shuffle(pool.filter((d) => d.moods.includes(pick))).slice(0, 4);
    return [];
    // roll re-runs the spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, mine, roll]);

  const changeSlot = (s: Slot) => {
    setSlot(s);
    setFocus(null);
  };
  const step = (by: number) => setFocus((at + by + meal.length) % meal.length);

  const readMenu = () => {
    Speech.stop();
    const names = meal.map((d) => nameIn(d.name, lang)).join(', ');
    Speech.speak(`${t(TITLE_A[slot])} ${t(TITLE_B[slot])}: ${names}`, { language: SPEECH_LANG[lang], rate: 0.85 });
  };

  const ingredientsLine = (d: Dish) =>
    d.ings
      .filter(([id]) => ingredient(id).kind === 'main' && id !== 'water')
      .slice(0, 4)
      .map(([id]) => ingName(ingredient(id).name, lang))
      .join(', ');

  const toggle = (p: typeof pick) => setPick(pick === p ? null : p);
  const list = results.length > 0 && (
    <Glass style={{ padding: 16, gap: 14 }}>
      {results.map((d) => (
        <DishRow key={d.id} dish={d} />
      ))}
    </Glass>
  );

  return (
    <Screen photo={photoOf(dish?.id)}>
      <TopBar
        left={<Circle icon="people" label={`${t('familyA')} ${t('familyB')}`} onPress={() => router.push('/family')} />}
        title={new Date().toLocaleDateString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { weekday: 'long', day: 'numeric', month: 'long' })}
        right={
          <IconPill>
            <Circle icon="volume-high-outline" label={t('readAloud')} kind="glass" size={40} onPress={readMenu} />
            <Circle icon="shuffle" label={t('spinTitle')} kind="white" size={40} onPress={() => { setPick('spin'); setRoll(roll + 1); }} />
          </IconPill>
        }
      />

      <Headline a={t(TITLE_A[slot])} b={t(TITLE_B[slot])} side={`${today?.fast ? `🙏 ${t('fastDay')}` : `${meal.length} ${t('dishCount')}`}${today?.guests ? `  ·  +${today.guests} ${t('guests')}` : ''}`} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SLOTS.map((s) => (
          <Chip key={s} label={t(s)} on={slot === s} onPress={() => changeSlot(s)} />
        ))}
      </ScrollView>

      {dish ? (
        <View style={{ paddingTop: 70 }}>
          <Link href={{ pathname: '/dish/[id]', params: { id: dish.id } }} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={nameIn(dish.name, lang)}>
              <Glass style={{ paddingTop: 100, paddingBottom: 22, paddingHorizontal: 22, alignItems: 'center', gap: 6 }}>
                <T kind="title" style={{ textAlign: 'center' }}>
                  {nameIn(dish.name, lang)}
                </T>
                <T kind="small" dim style={{ textAlign: 'center' }} lines={2}>
                  {nameIn(COURSE_LABEL[dish.course], lang)}  ·  {minutes(dish, lang)}
                </T>
                <T kind="small" dim style={{ textAlign: 'center' }} lines={2}>
                  {ingredientsLine(dish)}
                </T>
              </Glass>
            </Pressable>
          </Link>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
            <DishPhoto dish={dish} size={168} plate />
          </View>
          {meal.length > 1 && (
            <>
              <View style={{ position: 'absolute', left: 10, top: 150 }}>
                <Circle icon="chevron-back" label={t('back')} kind="glass" size={40} onPress={() => step(-1)} />
              </View>
              <View style={{ position: 'absolute', right: 10, top: 150 }}>
                <Circle icon="chevron-forward" label={t('next')} kind="glass" size={40} onPress={() => step(1)} />
              </View>
            </>
          )}
        </View>
      ) : (
        <Button label={t('newWeek')} onPress={() => newWeek()} />
      )}

      {meal.length > 1 && (
        <Row style={{ justifyContent: 'center', gap: 10 }}>
          {meal.map((d, i) => (
            <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={nameIn(d.name, lang)} onPress={() => setFocus(i)}>
              <View style={{ borderRadius: 30, padding: 3, borderWidth: 2, borderColor: i === at ? C.accent : 'transparent' }}>
                <DishPhoto dish={d} size={48} round />
              </View>
            </Pressable>
          ))}
        </Row>
      )}

      {dish && (
        <Row style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <T kind="small" dim>
            {t('howWasIt')}
          </T>
          {FACES.map(([r, face, key]) => (
            <Chip key={key} label={`${face} ${t(key)}`} on={profile!.ratings?.[dish.id] === r} onPress={() => rate(dish.id, r)} />
          ))}
        </Row>
      )}

      <Glass style={{ padding: 18, gap: 12 }} tint="rgba(255,140,170,0.10)">
        {thankedToday ? (
          <Row style={{ gap: 12 }}>
            <Circle icon="heart" label={t('thankMummy')} kind="lime" size={40} />
            <T kind="label" style={{ flex: 1 }}>
              {t('thanked')}
            </T>
          </Row>
        ) : (
          <Button label={`${t('thankMummy')} ❤️`} icon="heart" onPress={sayThanks} />
        )}
        <T kind="small" dim style={{ textAlign: 'center' }}>
          🔥 {days} {t('streakDays')}  ·  {thanks.length} {t('thanksTotal')}
        </T>
        {days >= 7 && (
          <T kind="small" color={C.accent} style={{ textAlign: 'center' }}>
            🏅 {t('badgeWeek')}
          </T>
        )}
      </Glass>

      {tips.map((tip) => (
        <Glass key={tip.reason} style={{ padding: 18, gap: 14 }} tint="rgba(207,245,74,0.10)">
          <Row style={{ gap: 10 }}>
            <Circle icon="leaf" label={t('completePlate')} kind="lime" size={34} />
            <T kind="label" style={{ flex: 1 }}>
              {t(tip.reason === 'protein' ? 'lowProtein' : 'lowFibre')}
            </T>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {tip.dishIds.map((id) => {
              const d = DISH_BY_ID.get(id)!;
              return (
                <Link key={id} href={{ pathname: '/dish/[id]', params: { id } }} asChild>
                  <Pressable accessibilityRole="link" style={{ width: 86, gap: 6, alignItems: 'center' }}>
                    <DishPhoto dish={d} size={66} plate />
                    <T kind="tiny" style={{ textAlign: 'center' }} lines={2}>
                      {nameIn(d.name, lang)}
                    </T>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        </Glass>
      ))}

      <Row style={{ gap: 12 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: pick === 'tired' }} onPress={() => toggle('tired')} style={{ flex: 1 }}>
          <View style={{ backgroundColor: C.accent, borderRadius: 28, padding: 18, minHeight: 132, justifyContent: 'space-between' }}>
            <Circle icon="flash" label={t('tired')} kind="ink" size={36} />
            <View>
              <T kind="label" weight={600} color={C.ink}>
                {t('tired')}
              </T>
              <T kind="small" color={C.ink}>
                {t('tiredSub')}
              </T>
            </View>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pick === 'spin' }}
          onPress={() => {
            setPick('spin');
            setRoll(roll + 1);
          }}
          style={{ flex: 1 }}>
          <Glass style={{ padding: 18, minHeight: 132, justifyContent: 'space-between' }}>
            <Circle icon="shuffle" label={t('spinTitle')} size={36} />
            <View>
              <T kind="label" weight={600}>
                {t('spinTitle')}
              </T>
              <T kind="small" dim>
                {t('spinSub')}
              </T>
            </View>
          </Glass>
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
