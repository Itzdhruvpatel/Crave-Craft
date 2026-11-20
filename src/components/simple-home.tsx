import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { C, DishPhoto, Glass, Row, Screen, T, photoOf, useLang } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { SPEECH_LANG, nameIn } from '@/lib/i18n.ts';
import { SLOTS, isoDate } from '@/lib/planner.ts';
import { setSimple, useApp, useT } from '@/state';

/** Big-button home for elders: today's food in large type, one tap to hear it. */
export function SimpleHome() {
  const { plan } = useApp();
  const t = useT();
  const lang = useLang();
  const today = plan?.find((d) => d.date === isoDate(new Date()));
  const hero = today?.lunch[0];

  const speakAll = () => {
    if (!today) return;
    Speech.stop();
    const text = SLOTS.map((s) => `${t(s)}: ${today[s].map((id) => nameIn(DISH_BY_ID.get(id)!.name, lang)).join(', ')}`).join('. ');
    Speech.speak(text, { language: SPEECH_LANG[lang], rate: 0.8 });
  };

  return (
    <Screen photo={photoOf(hero)} tabs={false}>
      <T kind="display" style={{ fontSize: 44, lineHeight: 52, paddingTop: 12 }} weight={600}>
        {t('todaysMenu')}
      </T>

      <Pressable accessibilityRole="button" accessibilityLabel={t('readAloud')} onPress={speakAll}>
        <View style={{ backgroundColor: C.accent, borderRadius: 32, paddingVertical: 28, alignItems: 'center', gap: 6 }}>
          <T style={{ fontSize: 56, lineHeight: 64 }}>🔊</T>
          <T kind="title" color={C.ink} style={{ fontSize: 30, lineHeight: 38 }}>
            {t('readAloud')}
          </T>
        </View>
      </Pressable>

      {today &&
        SLOTS.map((s) => (
          <Glass key={s} style={{ padding: 20, gap: 14 }}>
            <T kind="title" style={{ fontSize: 30, lineHeight: 38 }}>
              {t(s)}
            </T>
            {today[s].map((id) => {
              const d = DISH_BY_ID.get(id)!;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="link"
                  onPress={() => router.push({ pathname: '/dish/[id]', params: { id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <DishPhoto dish={d} size={84} round />
                  <T style={{ fontSize: 26, lineHeight: 34, flex: 1 }} weight={500}>
                    {nameIn(d.name, lang)}
                  </T>
                </Pressable>
              );
            })}
          </Glass>
        ))}

      <Row style={{ justifyContent: 'center', paddingTop: 10 }}>
        <Pressable accessibilityRole="button" onPress={() => setSimple(false)} style={{ padding: 14 }}>
          <T kind="label" dim style={{ textDecorationLine: 'underline' }}>
            {t('simpleExit')}
          </T>
        </Pressable>
      </Row>
    </Screen>
  );
}
