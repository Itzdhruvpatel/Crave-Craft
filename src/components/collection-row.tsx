import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { DishPhoto, T, useLang } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import type { Collection } from '@/data/collections.ts';
import { nameIn } from '@/lib/i18n.ts';
import { fitsDiet } from '@/lib/nutrition.ts';
import type { Diet } from '@/lib/types.ts';

/** A named menu (festival, leftovers) as a swipeable row of plated dishes. */
export function CollectionRow({ c, diet }: { c: Collection; diet: Diet }) {
  const lang = useLang();
  const dishes = c.dishIds.map((id) => DISH_BY_ID.get(id)!).filter((d) => fitsDiet(d, diet));
  if (!dishes.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <T kind="label">{nameIn(c.name, lang)}</T>
      <View style={{ marginHorizontal: -20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}>
          {dishes.map((d) => (
            <Link key={d.id} href={{ pathname: '/dish/[id]', params: { id: d.id } }} asChild>
              <Pressable accessibilityRole="link" style={{ width: 92, gap: 6, alignItems: 'center' }}>
                <DishPhoto dish={d} size={80} plate />
                <T kind="tiny" style={{ textAlign: 'center' }} lines={2}>
                  {nameIn(d.name, lang)}
                </T>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
