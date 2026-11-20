import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Chip, Circle, DishRow, Glass, Headline, Row, Screen, T, TopBar, photoOf } from '@/components/ui';
import { DISHES } from '@/data/dishes/index.ts';
import { cookFromFridge, keyIngredients } from '@/lib/fridge.ts';
import { aisleOf, type Aisle } from '@/lib/grocery.ts';
import { nameIn, type StrKey } from '@/lib/i18n.ts';
import { fitsDiet } from '@/lib/nutrition.ts';
import { ingredient } from '@/lib/scale.ts';
import { togglePantry, useApp, useT } from '@/state';

const AISLES: Aisle[] = ['veg', 'dairy', 'grains', 'ready'];

export default function Fridge() {
  const { profile, pantry } = useApp();
  const t = useT();
  const lang = profile!.lang;
  const mine = useMemo(() => DISHES.filter((d) => fitsDiet(d, profile!.diet)), [profile]);

  // The ingredients worth asking about: the ones that actually decide dishes, most common first.
  const options = useMemo(() => {
    const count = new Map<string, number>();
    for (const d of mine) for (const k of keyIngredients(d)) count.set(k, (count.get(k) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [mine]);

  const matches = useMemo(() => cookFromFridge(pantry, mine).slice(0, 20), [pantry, mine]);

  return (
    <Screen photo={photoOf(matches[0]?.dish.id ?? 'methi_bateta')} tabs={false}>
      <TopBar
        left={<Circle icon="chevron-back" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
        title={t('ideas')}
      />
      <Headline a={t('fridgeA')} b={t('fridgeB')} />
      <T dim>{t('fridgeHint')}</T>

      {AISLES.map((a) => {
        const ids = options.filter((id) => aisleOf(id) === a).slice(0, a === 'veg' ? 30 : 14);
        if (!ids.length) return null;
        return (
          <View key={a} style={{ gap: 10 }}>
            <T kind="h2">{t(`aisle_${a}` as StrKey)}</T>
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {ids.map((id) => (
                <Chip
                  key={id}
                  icon={pantry.includes(id) ? 'checkmark' : undefined}
                  label={nameIn(ingredient(id).name, lang)}
                  on={pantry.includes(id)}
                  onPress={() => togglePantry(id)}
                />
              ))}
            </Row>
          </View>
        );
      })}

      {matches.length > 0 && (
        <Glass style={{ padding: 18, gap: 14 }}>
          {matches.map((m) => (
            <DishRow
              key={m.dish.id}
              dish={m.dish}
              note={m.missing.length ? `${t('missing')}: ${m.missing.map((id) => nameIn(ingredient(id).name, lang)).join(', ')}` : `✓ ${t('haveAll')}`}
            />
          ))}
        </Glass>
      )}
    </Screen>
  );
}
