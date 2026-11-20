import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useListen } from '@/components/listen';
import { C, DishPhoto, Glass, Row, Screen, T, photoOf, useLang } from '@/components/ui';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import { sayToFamily } from '@/family';
import { SPEECH_LANG, nameIn } from '@/lib/i18n.ts';
import { SLOTS, isoDate } from '@/lib/planner.ts';
import { parseCommand } from '@/lib/voice.ts';
import { setSimple, useApp, useT } from '@/state';

/** Big-button home for elders: today's food in large type, one tap to hear it. */
export function SimpleHome() {
  const { plan } = useApp();
  const t = useT();
  const lang = useLang();
  const today = plan?.find((d) => d.date === isoDate(new Date()));
  const hero = today?.lunch[0];

  const [heard, setHeard] = useState('');
  const say = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: SPEECH_LANG[lang], rate: 0.8 });
  };
  const speakAll = () => {
    if (!today) return;
    say(SLOTS.map((s) => `${t(s)}: ${today[s].map((id) => nameIn(DISH_BY_ID.get(id)!.name, lang)).join(', ')}`).join('. '));
  };

  // "aaj kya banega", "dal dhokli kaise banate hai", "aaje dal dhokli banavo", or anything else for the family.
  const act = async (text: string) => {
    setHeard(text);
    const c = parseCommand(text, DISHES);
    if (c.kind === 'menu') return speakAll();
    if (c.kind === 'recipe') return router.push({ pathname: '/dish/[id]', params: { id: c.dish.id } });
    const sent = c.kind === 'request' ? await sayToFamily(`🙏 ${nameIn(c.dish.name, lang)}`, c.dish.id) : await sayToFamily(c.text);
    say(sent ? t('sentToFamily') : t('notInFamily'));
  };
  const ear = useListen(lang, (text) => void act(text).catch(() => say(t('notInFamily'))));

  const tile = (emoji: string, label: string, onPress: () => void, lime?: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flex: 1 }}>
      <View style={{ backgroundColor: lime ? C.accent : 'rgba(40,43,37,0.85)', borderRadius: 32, paddingVertical: 24, alignItems: 'center', gap: 6 }}>
        <T style={{ fontSize: 52, lineHeight: 60 }}>{emoji}</T>
        <T kind="title" color={lime ? C.ink : C.text} style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>
          {label}
        </T>
      </View>
    </Pressable>
  );

  return (
    <Screen photo={photoOf(hero)} tabs={false}>
      <T kind="display" style={{ fontSize: 44, lineHeight: 52, paddingTop: 12 }} weight={600}>
        {t('todaysMenu')}
      </T>

      {tile(ear.listening ? '👂' : '🎤', ear.listening ? t('listening') : t('speakNow'), ear.start, true)}
      {heard ? (
        <T kind="title" style={{ textAlign: 'center' }}>
          “{heard}”
        </T>
      ) : (
        <T dim style={{ textAlign: 'center' }}>
          {t('speakHint')}
        </T>
      )}
      {ear.error ? (
        <T kind="small" color={C.warn} style={{ textAlign: 'center' }}>
          {t('micProblem')}
        </T>
      ) : null}
      <Row style={{ gap: 12 }}>
        {tile('🔊', t('readAloud'), speakAll)}
        {tile('👨‍👩‍👧', t('talkFamily'), () => router.push('/family'))}
      </Row>

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
