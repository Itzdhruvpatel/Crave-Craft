import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Button, C, Chip, Circle, Glass, Headline, Row, Screen, T, TopBar, photoOf } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { formatBuy, groceryList, type Aisle } from '@/lib/grocery.ts';
import { ingName, type StrKey } from '@/lib/i18n.ts';
import { isoDate } from '@/lib/planner.ts';
import { ingredient } from '@/lib/scale.ts';
import { toggleBought, useApp, useT } from '@/state';

const AISLES: Aisle[] = ['veg', 'dairy', 'grains', 'ready', 'pantry'];

export default function Grocery() {
  const { profile, plan, bought } = useApp();
  const t = useT();
  const lang = profile!.lang;
  const [range, setRange] = useState<'week' | 'today'>('week');
  const today = isoDate(new Date());

  const items = useMemo(() => {
    const days = (plan ?? []).filter((d) => (range === 'today' ? d.date === today : d.date >= today));
    return groceryList(days, DISH_BY_ID, profile!.people, profile!.spice);
  }, [plan, range, today, profile]);

  const share = () => {
    const lines = AISLES.flatMap((a) => {
      const list = items.filter((i) => i.aisle === a && !bought.includes(i.id));
      if (!list.length) return [];
      return [`*${t(`aisle_${a}` as StrKey)}*`, ...list.map((i) => `- ${ingName(ingredient(i.id).name, lang)}: ${formatBuy(i)}`), ''];
    });
    Share.share({ message: `${t('groceryA')} ${t('groceryB')}\n\n${lines.join('\n')}` });
  };

  return (
    <Screen photo={photoOf('kachumber')} tabs={false}>
      <TopBar
        left={<Circle icon="chevron-back" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
        title={`${profile!.people} ${t('forPeople')}`}
        right={<Circle icon="share-social-outline" label={t('share')} kind="glass" onPress={share} />}
      />
      <Headline a={t('groceryA')} b={t('groceryB')} />
      <Row style={{ gap: 8 }}>
        <Chip label={t('restOfWeek')} on={range === 'week'} onPress={() => setRange('week')} />
        <Chip label={t('todayOnly')} on={range === 'today'} onPress={() => setRange('today')} />
      </Row>

      {items.length === 0 && (
        <Glass style={{ padding: 20 }}>
          <T dim>{t('nothingLeft')}</T>
        </Glass>
      )}

      {AISLES.map((a) => {
        const list = items.filter((i) => i.aisle === a);
        if (!list.length) return null;
        return (
          <Glass key={a} style={{ padding: 18, gap: 4 }}>
            <T kind="h2" style={{ paddingBottom: 6 }}>
              {t(`aisle_${a}` as StrKey)}
            </T>
            {list.map((i, k) => {
              const done = bought.includes(i.id);
              return (
                <Pressable
                  key={i.id}
                  accessibilityRole="checkbox"
                  aria-checked={done}
                  onPress={() => toggleBought(i.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: k ? 1 : 0, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      borderWidth: done ? 0 : 1.5,
                      borderColor: 'rgba(255,255,255,0.4)',
                      backgroundColor: done ? C.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {done && <Ionicons name="checkmark" size={16} color={C.ink} />}
                  </View>
                  <T style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>
                    {ingName(ingredient(i.id).name, lang)}
                  </T>
                  {a !== 'pantry' && (
                    <T kind="label" color={done ? C.textDim : C.accent}>
                      {formatBuy(i)}
                    </T>
                  )}
                </Pressable>
              );
            })}
          </Glass>
        );
      })}

      {items.length > 0 && <Button label={t('share')} icon="logo-whatsapp" onPress={share} />}
    </Screen>
  );
}
