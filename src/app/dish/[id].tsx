import * as Speech from 'expo-speech';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stepper } from '@/components/stepper';
import { Backdrop, Button, C, Chip, Circle, DishPhoto, DishRow, Glass, Headline, IconPill, Row, T, TopBar, photoOf, useLang } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { PHOTOS } from '@/data/photos';
import { stepsIn } from '@/data/steps.ts';
import { COURSE_LABEL, CUISINE_LABEL, DIET_LABEL, MOOD_LABEL, SPEECH_LANG, SPICE_LABEL, ingName, nameIn, type StrKey } from '@/lib/i18n.ts';
import { MEAL_TARGET, balanceTips, dietSkips, perServing } from '@/lib/nutrition.ts';
import { allergensIn, familyNeeds, healthAdjust } from '@/lib/health.ts';
import { isoDate } from '@/lib/planner.ts';
import { formatQty, ingredient, scaleDish } from '@/lib/scale.ts';
import type { SpiceLevel } from '@/lib/types.ts';
import { videoUrl } from '@/lib/video.ts';
import { toggleDislike, useApp, useT } from '@/state';

const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];

/** "Bhinda nu Shaak" -> thin "Bhinda", bold "nu Shaak". One-word names are all bold. */
function splitName(name: string): [string, string] {
  const i = name.indexOf(' ');
  return i < 0 ? ['', name] : [name.slice(0, i), name.slice(i + 1)];
}

export default function DishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = DISH_BY_ID.get(id);
  const { profile: maybeProfile, plan } = useApp();
  const profile = maybeProfile!;
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [people, setPeople] = useState(() => profile.people + (plan?.find((p) => p.date === isoDate(new Date()))?.guests ?? 0));
  const [spice, setSpice] = useState<SpiceLevel>(profile.spice);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => void Speech.stop(), []);

  if (!dish) return <T>{t('noResults')}</T>;

  const uri = photoOf(dish.id, 960);
  const skip = dietSkips(dish, profile.diet);
  const needs = familyNeeds(profile);
  const ings = healthAdjust(scaleDish(dish, people, spice), needs).filter((i) => !skip.includes(i.id));
  const members = profile.members ?? [];
  const risky = allergensIn(dish, needs.allergens);
  const allergic = members.filter((m) => m.allergies.some((a) => risky.includes(a))).map((m) => m.name);
  const diabetics = dish.course === 'sweet' ? members.filter((m) => m.health.includes('diabetic')).map((m) => m.name) : [];
  const trimmedFor = members.filter((m) => m.health.includes('lowSalt') || m.health.includes('lowOil')).map((m) => m.name);
  const n = perServing(dish);
  const credit = PHOTOS[dish.id];
  const disliked = profile.dislikes.includes(dish.id);
  const tips = ['sabji', 'oneDish', 'breakfast', 'farsan'].includes(dish.course) ? balanceTips([dish], DISHES, profile) : [];
  const [a, b] = splitName(nameIn(dish.name, lang));
  const steps = stepsIn(dish, lang);
  const heroH = Math.round(height * 0.5);

  const readAloud = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    // Read in the family's language when the steps are translated, else in Indian English.
    setSpeaking(true);
    Speech.speak([nameIn(dish.name, steps.lang), ...steps.steps].join('. '), {
      language: SPEECH_LANG[steps.lang],
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Backdrop uri={photoOf(dish.id, 330)} blur={40} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroH }}>
          {uri ? (
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <DishPhoto dish={dish} size={200} plate />
            </View>
          )}
          <LinearGradient colors={['rgba(11,13,10,0.5)', 'rgba(11,13,10,0)', 'rgba(11,13,10,0.2)', 'rgba(11,13,10,0.95)']} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20 }}>
            <TopBar
              left={<Circle icon="chevron-back" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
              title={nameIn(COURSE_LABEL[dish.course], lang)}
              right={
                <IconPill>
                  <Circle icon={speaking ? 'stop' : 'volume-high-outline'} label={speaking ? t('stop') : t('readAloud')} kind="glass" size={40} onPress={readAloud} />
                  <Circle icon={disliked ? 'thumbs-down' : 'thumbs-down-outline'} label={t('notAFan')} kind={disliked ? 'lime' : 'white'} size={40} onPress={() => toggleDislike(dish.id)} />
                </IconPill>
              }
            />
          </View>
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18 }}>
            <Headline a={a} b={b} size={40} />
            {lang !== 'en' && <T dim>{dish.name.en}</T>}
          </View>
        </View>

        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, gap: 18 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip icon="time-outline" label={`${dish.time} ${t('minutes')}`} />
            <Chip label={nameIn(CUISINE_LABEL[dish.cuisine], lang)} />
            {dish.moods.map((m) => (
              <Chip key={m} label={nameIn(MOOD_LABEL[m], lang)} />
            ))}
          </ScrollView>

          <Button label={t('cookMode')} icon="flame" kind="white" onPress={() => router.push({ pathname: '/cook/[id]', params: { id: dish.id } })} />
          <Row style={{ gap: 10 }}>
            <Button label={t('watchVideo')} icon="play" onPress={() => Linking.openURL(videoUrl(dish))} style={{ flex: 1 }} />
            <Button label={speaking ? t('stop') : t('readAloud')} icon={speaking ? 'stop' : 'volume-high'} kind="glass" onPress={readAloud} style={{ flex: 1 }} />
          </Row>

          <Glass style={{ padding: 20, gap: 18 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <T kind="small" dim>
                  {t('howMany')}
                </T>
                <T kind="h2">{t('servings')}</T>
              </View>
              <Stepper value={people} min={1} max={50} onChange={setPeople} />
            </Row>
            {dish.spicy && (
              <View style={{ gap: 10 }}>
                <T kind="h2">{t('spiceLevel')}</T>
                <Row style={{ gap: 8 }}>
                  {SPICES.map((s, i) => (
                    <View key={s} style={{ flex: 1 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: spice === s }}
                        onPress={() => setSpice(s)}
                        style={{ paddingVertical: 12, borderRadius: 999, alignItems: 'center', backgroundColor: spice === s ? C.accent : 'rgba(255,255,255,0.08)' }}>
                        <T kind="small" weight={600} color={spice === s ? C.ink : C.text}>
                          {'🌶'.repeat(i + 1)} {nameIn(SPICE_LABEL[s], lang)}
                        </T>
                      </Pressable>
                    </View>
                  ))}
                </Row>
              </View>
            )}
          </Glass>

          <Glass style={{ padding: 20, gap: 4 }}>
            <Headline a="" b={t('ingredients')} size={26} />
            {risky.length > 0 && (
              <T kind="small" color="#FF6B6B" style={{ paddingVertical: 6 }}>
                ⚠️ {t('allergyWarn')} {risky.map((a) => t(`allergy_${a}` as StrKey)).join(', ')}. {t('notFor')}: {allergic.join(', ')}
              </T>
            )}
            {diabetics.length > 0 && (
              <T kind="small" color={C.warn} style={{ paddingVertical: 6 }}>
                🍬 {t('sugarWarn')}: {diabetics.join(', ')}
              </T>
            )}
            {trimmedFor.length > 0 && (
              <T kind="small" dim style={{ paddingVertical: 6 }}>
                🧂 {t('trimmedNote')}: {trimmedFor.join(', ')}
              </T>
            )}
            {skip.length > 0 && (
              <T kind="small" color={C.warn} style={{ paddingVertical: 6 }}>
                {nameIn(DIET_LABEL[profile.diet], lang)}, {t('leaveOut')}: {skip.map((s) => ingName(ingredient(s).name, lang)).join(', ')}
              </T>
            )}
            {ings.map((i, k) => (
              <Row key={`${i.id}-${k}`} style={{ justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderTopWidth: k ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
                <T style={{ flex: 1 }}>{ingName(ingredient(i.id).name, lang)}</T>
                <T kind="label" color={C.accent}>
                  {formatQty(i.qty, i.unit, lang, i.id)}
                </T>
              </Row>
            ))}
          </Glass>

          <Glass style={{ padding: 20, gap: 16 }}>
            <Headline a="" b={t('method')} size={26} />
            {steps.lang !== lang && (
              <T kind="small" dim>
                {t('stepsEnglish')}
              </T>
            )}
            {steps.steps.map((s, k) => (
              <Row key={k} style={{ alignItems: 'flex-start', gap: 14 }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: k === 0 ? C.accent : 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <T kind="small" weight={600} color={k === 0 ? C.ink : C.text}>
                    {k + 1}
                  </T>
                </View>
                <T style={{ flex: 1, paddingTop: 4 }} color="rgba(255,255,255,0.86)">
                  {s}
                </T>
              </Row>
            ))}
          </Glass>

          <Glass style={{ padding: 20, gap: 16 }}>
            <Headline a="" b={t('nutrition')} size={22} />
            <Row style={{ alignItems: 'flex-end', gap: 8 }}>
              <T kind="display" style={{ fontSize: 52, lineHeight: 56 }}>
                {Math.round(n.kcal)}
              </T>
              <T dim style={{ paddingBottom: 10 }}>
                kcal
              </T>
            </Row>
            {(['protein', 'fibre'] as const).map((k) => (
              <View key={k} style={{ gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T kind="label">{t(k)}</T>
                  <T kind="label">{Math.round(n[k])} g</T>
                </Row>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <View style={{ width: `${Math.min(100, (n[k] / MEAL_TARGET[k]) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: C.accent }} />
                </View>
              </View>
            ))}
            <Row style={{ flexWrap: 'wrap', rowGap: 14 }}>
              {(['carbs', 'fat', 'sugar'] as const).map((k) => (
                <View key={k} style={{ width: '33%' }}>
                  <T kind="small" dim>
                    {t(k)}
                  </T>
                  <T kind="label">{Math.round(n[k])} g</T>
                </View>
              ))}
              {(['sodium', 'iron', 'calcium'] as const).map((k) => (
                <View key={k} style={{ width: '33%' }}>
                  <T kind="small" dim>
                    {t(k)}
                  </T>
                  <T kind="label">{k === 'iron' ? n.iron.toFixed(1) : Math.round(n[k])} mg</T>
                </View>
              ))}
            </Row>
            <T kind="tiny" dim>
              {t('approx')}
            </T>
          </Glass>

          {tips.map((tip) => (
            <Glass key={tip.reason} style={{ padding: 18, gap: 14 }} tint="rgba(207,245,74,0.10)">
              <Row style={{ gap: 10 }}>
                <Circle icon="leaf" label={t('completePlate')} kind="lime" size={34} />
                <T kind="label" style={{ flex: 1 }}>
                  {t(tip.reason === 'protein' ? 'lowProtein' : 'lowFibre')}
                </T>
              </Row>
              {tip.dishIds.map((x) => (
                <DishRow key={x} dish={DISH_BY_ID.get(x)!} />
              ))}
            </Glass>
          ))}

          {dish.pairs?.length ? (
            <Glass style={{ padding: 18, gap: 14 }}>
              <T kind="h2">{t('pairsWith')}</T>
              {dish.pairs.map((x) => (
                <DishRow key={x} dish={DISH_BY_ID.get(x)!} />
              ))}
            </Glass>
          ) : null}

          {credit && (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(credit.page)}>
              <T kind="tiny" dim>
                {t('photo')}: {credit.author || 'Wikimedia Commons'}, {credit.license}
              </T>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
