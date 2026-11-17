import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stepper } from '@/components/stepper';
import { Button, Chip, DishPhoto, DishRow, Row, T, useLang } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { PHOTOS } from '@/data/photos';
import { useTheme } from '@/hooks/use-theme';
import { COURSE_LABEL, CUISINE_LABEL, MOOD_LABEL, SPEECH_LANG, SPICE_LABEL, nameIn } from '@/lib/i18n.ts';
import { MEAL_TARGET, balanceTips, jainSkips, perServing } from '@/lib/nutrition.ts';
import { formatQty, ingredient, scaleDish } from '@/lib/scale.ts';
import type { Cuisine, Dish, SpiceLevel } from '@/lib/types.ts';
import { toggleDislike, useApp, useT } from '@/state';

// Trusted, real cooking channels. Search is limited to dish name + channel until a fixed video id is stored.
const CHANNEL: Partial<Record<Cuisine, string>> = {
  gujarati: 'Hebbars Kitchen',
  punjabi: 'Ranveer Brar',
  south: 'Hebbars Kitchen',
  maharashtrian: 'Madhuras Recipe',
  street: 'Ranveer Brar',
};

function videoUrl(d: Dish): string {
  if (d.video) return `https://www.youtube.com/watch?v=${d.video}`;
  const q = `${d.name.en} recipe ${CHANNEL[d.cuisine] ?? 'Nisha Madhulika'}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];

export default function DishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = DISH_BY_ID.get(id);
  const profile = useApp().profile!;
  const t = useT();
  const c = useTheme();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState(profile.people);
  const [spice, setSpice] = useState<SpiceLevel>(profile.spice);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => void Speech.stop(), []);

  if (!dish) return <T>{t('noResults')}</T>;

  const skip = profile.diet === 'jain' ? jainSkips(dish) : [];
  const ings = scaleDish(dish, people, spice).filter((i) => !skip.includes(i.id));
  const n = perServing(dish);
  const photo = PHOTOS[dish.id];
  const disliked = profile.dislikes.includes(dish.id);
  const tips = ['sabji', 'oneDish', 'breakfast', 'farsan'].includes(dish.course) ? balanceTips([dish], DISHES, profile.diet) : [];

  const readAloud = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    // Steps are in English for now, so they are read with an Indian English voice.
    setSpeaking(true);
    Speech.speak([dish.name.en, ...dish.steps].join('. '), {
      language: SPEECH_LANG.en,
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  const section = { gap: 14 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={{ paddingBottom: 48 + insets.bottom }}>
      <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
        <View>
          <DishPhoto dish={dish} radius={0} style={{ aspectRatio: 1.1 }} />
          <LinearGradient
            colors={['rgba(17,22,46,0)', 'rgba(17,22,46,0.55)', 'rgba(17,22,46,0.88)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', justifyContent: 'flex-end', padding: 20, gap: 4 }}>
            <T kind="title" color="#FFFFFF">
              {nameIn(dish.name, lang)}
            </T>
            {lang !== 'en' && <T color="#E6E9F5">{dish.name.en}</T>}
          </LinearGradient>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={{
              position: 'absolute',
              top: insets.top + 12,
              left: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: 22, color: c.text }}>←</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 32 }}>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Chip label={`⏱ ${dish.time} ${t('minutes')}`} />
            <Chip label={nameIn(CUISINE_LABEL[dish.cuisine], lang)} />
            <Chip label={nameIn(COURSE_LABEL[dish.course], lang)} />
            {dish.moods.map((m) => (
              <Chip key={m} label={nameIn(MOOD_LABEL[m], lang)} />
            ))}
          </Row>

          <Row style={{ gap: 10 }}>
            <Button label={`▶  ${t('watchVideo')}`} onPress={() => Linking.openURL(videoUrl(dish))} style={{ flex: 1 }} />
            <Button label={speaking ? `■  ${t('stop')}` : `🔊  ${t('readAloud')}`} kind="soft" onPress={readAloud} style={{ flex: 1 }} />
          </Row>

          <View style={{ backgroundColor: c.backgroundElement, borderRadius: 28, padding: 20, gap: 20 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T kind="h2">{t('servings')}</T>
              <Stepper value={people} min={1} max={50} onChange={setPeople} />
            </Row>
            {dish.spicy && (
              <View style={{ gap: 10 }}>
                <T kind="h2">{t('spiceLevel')}</T>
                <Row style={{ backgroundColor: c.background, borderRadius: 999, padding: 4 }}>
                  {SPICES.map((s, i) => (
                    <Pressable
                      key={s}
                      accessibilityRole="button"
                      accessibilityState={{ selected: spice === s }}
                      onPress={() => setSpice(s)}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: spice === s ? c.accent : 'transparent' }}>
                      <T kind="small" style={{ textAlign: 'center' }} color={spice === s ? c.accentText : c.text}>
                        {'🌶'.repeat(i + 1)} {nameIn(SPICE_LABEL[s], lang)}
                      </T>
                    </Pressable>
                  ))}
                </Row>
              </View>
            )}
          </View>

          <View style={section}>
            <T kind="title">{t('ingredients')}</T>
            {skip.length > 0 && (
              <T kind="small" color={c.warn}>
                {t('jainNote')}: {skip.map((s) => nameIn(ingredient(s).name, lang)).join(', ')}
              </T>
            )}
            <View>
              {ings.map((i, k) => (
                <Row
                  key={`${i.id}-${k}`}
                  style={{ justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: c.border }}>
                  <T style={{ flex: 1 }}>{nameIn(ingredient(i.id).name, lang)}</T>
                  <T kind="label">{formatQty(i.qty, i.unit)}</T>
                </Row>
              ))}
            </View>
          </View>

          <View style={section}>
            <T kind="title">{t('method')}</T>
            {dish.steps.map((s, k) => (
              <Row key={k} style={{ alignItems: 'flex-start', gap: 14 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.haldi, alignItems: 'center', justifyContent: 'center' }}>
                  <T kind="label" color={c.onHaldi}>
                    {k + 1}
                  </T>
                </View>
                <T style={{ flex: 1, paddingTop: 3 }}>{s}</T>
              </Row>
            ))}
          </View>

          <View style={section}>
            <T kind="title">{t('nutrition')}</T>
            <Row style={{ alignItems: 'flex-end', gap: 8 }}>
              <T kind="display">{Math.round(n.kcal)}</T>
              <T dim style={{ paddingBottom: 6 }}>
                kcal
              </T>
            </Row>
            {(['protein', 'fibre'] as const).map((k) => (
              <View key={k} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T kind="label">{t(k)}</T>
                  <T kind="label">{Math.round(n[k])} g</T>
                </Row>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: c.backgroundElement }}>
                  <View
                    style={{
                      width: `${Math.min(100, (n[k] / MEAL_TARGET[k]) * 100)}%`,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: c.good,
                    }}
                  />
                </View>
              </View>
            ))}
            <Row style={{ flexWrap: 'wrap', rowGap: 12 }}>
              {(['carbs', 'fat', 'sugar'] as const).map((k) => (
                <View key={k} style={{ width: '33%' }}>
                  <T kind="small" dim>
                    {t(k)}
                  </T>
                  <T kind="label">{Math.round(n[k])} g</T>
                </View>
              ))}
              <View style={{ width: '33%' }}>
                <T kind="small" dim>
                  {t('sodium')}
                </T>
                <T kind="label">{Math.round(n.sodium)} mg</T>
              </View>
            </Row>
            <T kind="small" dim>
              {t('approx')}
            </T>
          </View>

          {tips.map((tip) => (
            <View key={tip.reason} style={{ backgroundColor: c.goodSoft, borderRadius: 24, padding: 18, gap: 14 }}>
              <T kind="label" color={c.good}>
                🌿 {t(tip.reason === 'protein' ? 'lowProtein' : 'lowFibre')}
              </T>
              {tip.dishIds.map((x) => (
                <DishRow key={x} dish={DISH_BY_ID.get(x)!} />
              ))}
            </View>
          ))}

          {dish.pairs?.length ? (
            <View style={section}>
              <T kind="title">{t('pairsWith')}</T>
              {dish.pairs.map((x) => (
                <DishRow key={x} dish={DISH_BY_ID.get(x)!} />
              ))}
            </View>
          ) : null}

          <Button label={disliked ? `✓ ${t('notAFan')}` : t('notAFan')} kind="soft" onPress={() => toggleDislike(dish.id)} />

          {photo && (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(photo.page)}>
              <T kind="small" dim>
                {t('photo')}: {photo.author || 'Wikimedia Commons'}, {photo.license}
              </T>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
