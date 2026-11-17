import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { font } from '@/constants/fonts';
import { Chip, DishPhoto, Row, Screen, T, minutes, useLang } from '@/components/ui';
import { DISHES } from '@/data/dishes/index.ts';
import { useTheme } from '@/hooks/use-theme';
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
  const c = useTheme();
  const lang = useLang();
  const [q, setQ] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);

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

  const chips = <K extends string>(keys: K[], labels: Record<K, { en: string }>, value: K | null, set: (k: K | null) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {keys.map((k) => (
        <Chip key={k} label={nameIn(labels[k], lang)} on={value === k} onPress={() => set(value === k ? null : k)} />
      ))}
    </ScrollView>
  );

  return (
    <Screen>
      <T kind="display" style={{ paddingTop: 12 }}>
        {t('dishes')}
      </T>
      <View style={{ gap: 10 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('search')}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t('search')}
          style={{
            backgroundColor: c.backgroundElement,
            color: c.text,
            borderRadius: 999,
            paddingHorizontal: 20,
            paddingVertical: 14,
            fontSize: 16,
            fontFamily: font(lang, 400),
          }}
        />
        {chips(COURSES, COURSE_LABEL, course, setCourse)}
        {chips(MOODS, MOOD_LABEL, mood, setMood)}
        {chips(CUISINES, CUISINE_LABEL, cuisine, setCuisine)}
      </View>

      {list.length ? (
        <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22, alignItems: 'flex-start' }}>
          {list.map((d) => (
            <Link key={d.id} href={{ pathname: '/dish/[id]', params: { id: d.id } }} asChild>
              <Pressable accessibilityRole="link" style={{ width: '48%', gap: 8 }}>
                <DishPhoto dish={d} radius={24} />
                <View>
                  <T kind="label" lines={2}>
                    {nameIn(d.name, lang)}
                  </T>
                  <T kind="small" dim>
                    {minutes(d, lang)}
                  </T>
                </View>
              </Pressable>
            </Link>
          ))}
        </Row>
      ) : (
        <T dim>{t('noResults')}</T>
      )}
    </Screen>
  );
}
