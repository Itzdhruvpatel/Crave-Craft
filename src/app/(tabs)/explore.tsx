import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';

import { C, Chip, Circle, DishPhoto, Glass, Headline, IconPill, Row, Screen, T, TopBar, minutes, photoOf, useLang } from '@/components/ui';
import { font } from '@/constants/fonts';
import { CollectionRow } from '@/components/collection-row';
import { FESTIVALS, LEFTOVERS } from '@/data/collections.ts';
import { DISHES } from '@/data/dishes/index.ts';
import { videoUrl } from '@/lib/video.ts';
import { COURSE_LABEL, CUISINE_LABEL, MOOD_LABEL, nameIn } from '@/lib/i18n.ts';
import { fitsDiet } from '@/lib/nutrition.ts';
import type { Course, Cuisine, Mood } from '@/lib/types.ts';
import { useApp, useT } from '@/state';

const COURSES = Object.keys(COURSE_LABEL) as Course[];
const CUISINES = Object.keys(CUISINE_LABEL) as Cuisine[];
const MOODS = Object.keys(MOOD_LABEL) as Mood[];

export default function Explore() {
  const { profile } = useApp();
  const t = useT();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const [q, setQ] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DISHES.filter(
      (d) =>
        fitsDiet(d, profile!.diet) &&
        (!course || d.course === course) &&
        (!cuisine || d.cuisine === cuisine) &&
        (!mood || d.moods.includes(mood)) &&
        (!needle || Object.values(d.name).some((n) => n?.toLowerCase().includes(needle))),
    ).sort((a, b) => nameIn(a.name, lang).localeCompare(nameIn(b.name, lang)));
  }, [q, course, cuisine, mood, profile, lang]);

  // Big cards for dishes that have real photos; everything else is in the grid below.
  const featured = list.filter((d) => photoOf(d.id)).slice(0, 8);
  const [active, setActive] = useState(0);
  const cardW = Math.min(width - 40, 520) * 0.82;

  const chips = <K extends string>(keys: K[], labels: Record<K, { en: string }>, value: K | null, set: (k: K | null) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <Chip label={t('all')} on={!value} onPress={() => set(null)} />
      {keys.map((k) => (
        <Chip key={k} label={nameIn(labels[k], lang)} on={value === k} onPress={() => set(value === k ? null : k)} />
      ))}
    </ScrollView>
  );

  return (
    <Screen photo={photoOf(featured[active]?.id)}>
      <TopBar
        left={<Circle icon="chevron-back" label={t('back')} kind="ink" onPress={() => router.navigate('/')} />}
        title={t('dishes')}
        right={
          <IconPill>
            <Circle icon="options-outline" label={t('all')} kind="glass" size={40} onPress={() => setShowFilters(!showFilters)} />
            <Circle icon="person" label={t('settings')} size={40} onPress={() => router.navigate('/settings')} />
          </IconPill>
        }
      />

      <Headline a={t('dishesA')} b={t('dishesB')} right />

      <Glass radius={999}>
        <Row style={{ paddingHorizontal: 18, gap: 10 }}>
          <Ionicons name="search" size={18} color={C.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('search')}
            placeholderTextColor={C.textDim}
            accessibilityLabel={t('search')}
            style={{ flex: 1, color: C.text, paddingVertical: 14, fontSize: 16, fontFamily: font(lang, 400) }}
          />
        </Row>
      </Glass>

      {chips(COURSES, COURSE_LABEL, course, setCourse)}
      {showFilters && (
        <View style={{ gap: 10 }}>
          {chips(MOODS, MOOD_LABEL, mood, setMood)}
          {chips(CUISINES, CUISINE_LABEL, cuisine, setCuisine)}
        </View>
      )}

      {featured.length > 0 && (
        <View style={{ marginHorizontal: -20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardW + 14}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            onScroll={(e) => setActive(Math.max(0, Math.min(featured.length - 1, Math.round(e.nativeEvent.contentOffset.x / (cardW + 14)))))}
            scrollEventThrottle={32}>
            {featured.map((d) => (
              <Link key={d.id} href={{ pathname: '/dish/[id]', params: { id: d.id } }} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={nameIn(d.name, lang)} style={{ width: cardW, height: cardW * 1.22 }}>
                  <View style={{ flex: 1, borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
                    <Image source={{ uri: photoOf(d.id) }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={250} />
                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']} locations={[0.45, 1]} style={{ position: 'absolute', inset: 0 }} />
                    <View style={{ position: 'absolute', top: 16, right: 16 }}>
                      <Glass radius={999} style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
                        <T kind="tiny">{minutes(d, lang)}</T>
                      </Glass>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Circle icon="play" label={t('watchVideo')} kind="glass" size={72} onPress={() => Linking.openURL(videoUrl(d))} />
                    </View>
                    <View style={{ padding: 22 }}>
                      <T kind="display" style={{ fontSize: 32, lineHeight: 36 }} lines={2}>
                        {nameIn(d.name, lang)}
                      </T>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>
      )}

      {!q && !course && !mood && !cuisine && (
        <>
          <Pressable accessibilityRole="button" onPress={() => router.push('/fridge')}>
            <View style={{ backgroundColor: C.accent, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Circle icon="basket-outline" label={t('fridgeA')} kind="ink" size={44} />
              <View style={{ flex: 1 }}>
                <T kind="label" weight={600} color={C.ink}>
                  {t('fridgeA')} {t('fridgeB')}
                </T>
                <T kind="small" color={C.ink} lines={2}>
                  {t('fridgeHint')}
                </T>
              </View>
            </View>
          </Pressable>

          <Glass style={{ padding: 18, gap: 18 }}>
            <Headline a={t('leftoverA')} b={t('leftoverB')} size={24} />
            {LEFTOVERS.map((c) => (
              <CollectionRow key={c.id} c={c} diet={profile!.diet} />
            ))}
          </Glass>

          <Glass style={{ padding: 18, gap: 18 }}>
            <Headline a={t('festivalsA')} b={t('festivalsB')} size={24} />
            {FESTIVALS.map((c) => (
              <CollectionRow key={c.id} c={c} diet={profile!.diet} />
            ))}
          </Glass>
        </>
      )}

      <Row style={{ justifyContent: 'space-between' }}>
        <T kind="h2">{t('allDishes')}</T>
        <T kind="small" dim>
          {list.length}
        </T>
      </Row>

      {list.length ? (
        <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, alignItems: 'flex-start' }}>
          {list.map((d) => (
            <Link key={d.id} href={{ pathname: '/dish/[id]', params: { id: d.id } }} asChild>
              <Pressable accessibilityRole="link" style={{ width: '48%' }}>
                <Glass radius={26} style={{ padding: 8, gap: 8 }}>
                  <DishPhoto dish={d} radius={20} />
                  <View style={{ paddingHorizontal: 6, paddingBottom: 6 }}>
                    <T kind="label" lines={1}>
                      {nameIn(d.name, lang)}
                    </T>
                    <T kind="small" dim>
                      {minutes(d, lang)}
                    </T>
                  </View>
                </Glass>
              </Pressable>
            </Link>
          ))}
        </Row>
      ) : (
        <Glass style={{ padding: 20 }}>
          <T dim>{t('noResults')}</T>
        </Glass>
      )}
    </Screen>
  );
}
