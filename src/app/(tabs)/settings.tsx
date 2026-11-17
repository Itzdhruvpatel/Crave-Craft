import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Stepper } from '@/components/stepper';
import { Button, Chip, DishRow, IconButton, Row, Screen, T } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { CUISINE_LABEL, DIET_LABEL, LANGS, SPICE_LABEL, nameIn } from '@/lib/i18n.ts';
import type { Cuisine, Diet, Profile, SpiceLevel } from '@/lib/types.ts';
import { newWeek, resetAll, setProfile, toggleDislike, useApp, useT } from '@/state';

const DIETS: Diet[] = ['veg', 'jain', 'egg', 'nonveg'];
const REGIONS: Cuisine[] = ['gujarati', 'punjabi', 'south', 'maharashtrian', 'rajasthani', 'bengali'];
const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <T kind="h2">{title}</T>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {children}
    </ScrollView>
  );
}

export default function Settings() {
  const p = useApp().profile!;
  const t = useT();
  const up = (patch: Partial<Profile>, replan = false) => {
    setProfile({ ...p, ...patch });
    if (replan) newWeek();
  };

  return (
    <Screen>
      <T kind="display" style={{ paddingTop: 12 }}>
        {t('settings')}
      </T>

      <Group title={t('language')}>
        <ChipRow>
          {LANGS.map((l) => (
            <Chip key={l.id} label={l.label} on={p.lang === l.id} onPress={() => up({ lang: l.id })} />
          ))}
        </ChipRow>
      </Group>

      <Group title={t('diet')}>
        <ChipRow>
          {DIETS.map((d) => (
            <Chip key={d} label={nameIn(DIET_LABEL[d], p.lang)} on={p.diet === d} onPress={() => up({ diet: d }, true)} />
          ))}
        </ChipRow>
      </Group>

      <Group title={t('region')}>
        <ChipRow>
          {REGIONS.map((r) => (
            <Chip key={r} label={nameIn(CUISINE_LABEL[r], p.lang)} on={p.region === r} onPress={() => up({ region: r }, true)} />
          ))}
        </ChipRow>
      </Group>

      <Row style={{ justifyContent: 'space-between' }}>
        <T kind="h2">{t('people')}</T>
        <Stepper value={p.people} min={1} max={30} onChange={(people) => up({ people })} />
      </Row>

      <Group title={t('spice')}>
        <ChipRow>
          {SPICES.map((s, i) => (
            <Chip key={s} label={`${'🌶'.repeat(i + 1)} ${nameIn(SPICE_LABEL[s], p.lang)}`} on={p.spice === s} onPress={() => up({ spice: s })} />
          ))}
        </ChipRow>
      </Group>

      {p.dislikes.length > 0 && (
        <Group title={t('notAFan')}>
          <T kind="small" dim>
            {t('dislikedNote')}
          </T>
          {p.dislikes.map((id) => {
            const d = DISH_BY_ID.get(id);
            return d ? <DishRow key={id} dish={d} right={<IconButton glyph="✕" label={t('stop')} onPress={() => toggleDislike(id)} />} /> : null;
          })}
        </Group>
      )}

      <Button
        label={t('reset')}
        kind="soft"
        onPress={() => {
          resetAll();
          router.replace('/onboarding');
        }}
      />
    </Screen>
  );
}
