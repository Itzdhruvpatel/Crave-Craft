import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Stepper } from '@/components/stepper';
import { Button, C, Glass, Headline, Row, Screen, T, photoOf } from '@/components/ui';
import { CUISINE_LABEL, DIET_LABEL, HOME_STYLES, SPICE_LABEL, nameIn, toggleStyle, tr, type StrKey } from '@/lib/i18n.ts';
import type { Diet, Profile, SpiceLevel } from '@/lib/types.ts';
import { newWeek, setProfile, useLangNow } from '@/state';

const DIETS: Diet[] = ['veg', 'jain', 'egg', 'nonveg'];
const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];
// Language was already picked on the intro and login screens.
const STEPS: StrKey[] = ['qDiet', 'qRegion', 'qPeople', 'qSpice'];
const PHOTO = ['khaman', 'undhiyu', 'gujarati_dal', 'sev_tameta'];

export default function Onboarding() {
  const lang = useLangNow();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Omit<Profile, 'lang'>>({ diet: 'veg', regions: ['gujarati'], people: 4, spice: 'medium', dislikes: [] });
  const t = (k: StrKey) => tr(lang, k);
  const up = (patch: Partial<Profile>) => setP({ ...p, ...patch });
  const last = step === STEPS.length - 1;

  const option = (key: string, label: string, on: boolean, onPress: () => void, multi = false) => {
    const body = (
      <Row style={{ gap: 14, paddingVertical: 17, paddingHorizontal: 20 }}>
        <T kind="label" weight={on ? 600 : 400} color={on ? C.ink : C.text} style={{ flex: 1 }}>
          {label}
        </T>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: multi ? 8 : 13,
            borderWidth: on ? 0 : 1.5,
            borderColor: 'rgba(255,255,255,0.5)',
            backgroundColor: on ? C.ink : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {on && <Ionicons name="checkmark" size={16} color={C.accent} />}
        </View>
      </Row>
    );
    return (
      <Pressable key={key} accessibilityRole={multi ? 'checkbox' : 'radio'} aria-checked={on} onPress={onPress}>
        {on ? <View style={{ borderRadius: 22, backgroundColor: C.accent }}>{body}</View> : <Glass radius={22}>{body}</Glass>}
      </Pressable>
    );
  };

  return (
    <Screen photo={photoOf(PHOTO[step])} tabs={false}>
      <Row style={{ gap: 6, paddingTop: 8 }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? C.accent : 'rgba(255,255,255,0.2)' }} />
        ))}
      </Row>

      <View style={{ paddingTop: 40 }}>
        <Headline a={`${step + 1} / ${STEPS.length}`} b={t(STEPS[step])} size={34} />
      </View>

      <View style={{ gap: 10 }}>
        {step === 0 && DIETS.map((d) => option(d, nameIn(DIET_LABEL[d], lang), p.diet === d, () => up({ diet: d })))}
        {step === 1 && (
          <>
            <T dim>{t('pickAll')}</T>
            {HOME_STYLES.map((r) =>
              option(r, nameIn(CUISINE_LABEL[r], lang), p.regions.includes(r), () => up({ regions: toggleStyle(p.regions, r) }), true),
            )}
          </>
        )}
        {step === 2 && (
          <Glass style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Stepper value={p.people} min={1} max={30} onChange={(people) => up({ people })} />
          </Glass>
        )}
        {step === 3 &&
          SPICES.map((s, i) => option(s, `${'🌶'.repeat(i + 1)}  ${nameIn(SPICE_LABEL[s], lang)}`, p.spice === s, () => up({ spice: s })))}
      </View>

      <Row style={{ gap: 10, paddingTop: 8 }}>
        {step > 0 && <Button label={t('back')} kind="glass" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
        <Button
          label={last ? t('start') : t('next')}
          kind={last ? 'lime' : 'white'}
          onPress={() => {
            if (!last) return setStep(step + 1);
            setProfile({ ...p, lang });
            newWeek();
            router.replace('/');
          }}
          style={{ flex: 2 }}
        />
      </Row>
    </Screen>
  );
}
