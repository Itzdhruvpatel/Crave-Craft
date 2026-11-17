import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stepper } from '@/components/stepper';
import { Thali } from '@/components/thali';
import { Button, Row, T } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { useTheme } from '@/hooks/use-theme';
import { CUISINE_LABEL, DIET_LABEL, LANGS, SPICE_LABEL, nameIn, tr, type StrKey } from '@/lib/i18n.ts';
import type { Cuisine, Diet, Profile, SpiceLevel } from '@/lib/types.ts';
import { newWeek, setProfile } from '@/state';

const DIETS: Diet[] = ['veg', 'jain', 'egg', 'nonveg'];
const REGIONS: Cuisine[] = ['gujarati', 'punjabi', 'south', 'maharashtrian', 'rajasthani', 'bengali'];
const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];
const STEPS: StrKey[] = ['qLang', 'qDiet', 'qRegion', 'qPeople', 'qSpice'];
const DEMO = ['bharela_ringan', 'gujarati_dal', 'rotli', 'plain_rice'].map((id) => DISH_BY_ID.get(id)!);

export default function Onboarding() {
  const c = useTheme();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ diet: 'veg', region: 'gujarati', lang: 'en', people: 4, spice: 'medium', dislikes: [] });
  const t = (k: StrKey) => tr(p.lang, k);
  const up = (patch: Partial<Profile>) => setP({ ...p, ...patch });
  const last = step === STEPS.length - 1;

  const option = (key: string, label: string, on: boolean, onPress: () => void, sub?: string) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 22,
        backgroundColor: on ? c.text : c.backgroundElement,
      }}>
      <View style={{ flex: 1 }}>
        <T kind="h2" color={on ? c.background : c.text}>
          {label}
        </T>
        {sub && (
          <T kind="small" color={on ? c.background : c.textSecondary}>
            {sub}
          </T>
        )}
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: on ? c.haldi : c.textSecondary,
          backgroundColor: on ? c.haldi : 'transparent',
        }}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, padding: 20, gap: 24, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
        <Row style={{ gap: 6 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? c.accent : c.backgroundSelected }} />
          ))}
        </Row>

        {step === 0 && (
          <View style={{ gap: 6, alignItems: 'center', paddingTop: 8 }}>
            <Thali dishes={DEMO} maxSize={200} />
            <T kind="display" style={{ textAlign: 'center', marginTop: 16 }}>
              {t('appName')}
            </T>
            <T dim style={{ textAlign: 'center' }}>
              {t('tagline')}
            </T>
          </View>
        )}

        <T kind="title">{t(STEPS[step])}</T>

        <View style={{ gap: 10, flex: 1 }}>
          {step === 0 && LANGS.map((l) => option(l.id, l.label, p.lang === l.id, () => up({ lang: l.id })))}
          {step === 1 && DIETS.map((d) => option(d, nameIn(DIET_LABEL[d], p.lang), p.diet === d, () => up({ diet: d })))}
          {step === 2 && REGIONS.map((r) => option(r, nameIn(CUISINE_LABEL[r], p.lang), p.region === r, () => up({ region: r })))}
          {step === 3 && (
            <View style={{ alignItems: 'center', paddingTop: 24 }}>
              <Stepper value={p.people} min={1} max={30} onChange={(people) => up({ people })} />
            </View>
          )}
          {step === 4 &&
            SPICES.map((s, i) => option(s, `${'🌶'.repeat(i + 1)}  ${nameIn(SPICE_LABEL[s], p.lang)}`, p.spice === s, () => up({ spice: s })))}
        </View>

        <Row style={{ gap: 10 }}>
          {step > 0 && <Button label={t('back')} kind="soft" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
          <Button
            label={last ? t('start') : t('next')}
            onPress={() => {
              if (!last) return setStep(step + 1);
              setProfile(p);
              newWeek();
              router.replace('/');
            }}
            style={{ flex: 2 }}
          />
        </Row>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
