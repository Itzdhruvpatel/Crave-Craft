import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop, Button, C, Circle, Glass, IconPill, Row, T, TopBar, photoOf, useLang } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { stepsIn } from '@/data/steps.ts';
import { SPEECH_LANG, nameIn } from '@/lib/i18n.ts';
import { clock, stepMinutes } from '@/lib/timer.ts';
import { useT } from '@/state';

/** One step at a time, big text, read aloud, screen stays on, timers where a step says how long. */
export default function CookMode() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = DISH_BY_ID.get(id)!;
  const t = useT();
  const lang = useLang();
  const { steps, lang: stepLang } = stepsIn(dish, lang);
  const [at, setAt] = useState(0);
  const [voice, setVoice] = useState(true);
  const [left, setLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Times come from the English text even when the step is shown in Gujarati or Hindi; the lines match.
  const minutes = stepMinutes(dish.steps[at] ?? '');
  const last = at === steps.length - 1;

  useEffect(() => {
    Speech.stop();
    if (voice) Speech.speak(`${t('stepOf')} ${at + 1}. ${steps[at]}`, { language: SPEECH_LANG[stepLang], rate: 0.85 });
  }, [at, voice, steps, stepLang, t]);

  useEffect(
    () => () => {
      Speech.stop();
      if (tick.current) clearInterval(tick.current);
    },
    [],
  );

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setLeft((s) => {
        if (s === null) return s;
        if (s <= 1) {
          setRunning(false);
          Vibration.vibrate([0, 500, 300, 500, 300, 500]);
          Speech.speak(`${t('timer')}: ${t('done')}`, { language: SPEECH_LANG[lang] });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running, t, lang]);

  const go = (n: number) => {
    setAt(Math.max(0, Math.min(steps.length - 1, n)));
    setLeft(null);
    setRunning(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Backdrop uri={photoOf(dish.id, 330)} blur={30} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, gap: 20, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
          <TopBar
            left={<Circle icon="close" label={t('stop')} onPress={() => router.back()} />}
            title={nameIn(dish.name, lang)}
            right={
              <IconPill>
                <Circle icon={voice ? 'volume-high' : 'volume-mute'} label={t('readAloud')} kind={voice ? 'lime' : 'glass'} size={40} onPress={() => setVoice(!voice)} />
              </IconPill>
            }
          />

          <Row style={{ gap: 6 }}>
            {steps.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= at ? C.accent : 'rgba(255,255,255,0.2)' }} />
            ))}
          </Row>

          <T kind="small" dim>
            {t('stepOf')} {at + 1} / {steps.length}
          </T>

          <Pressable accessibilityRole="button" accessibilityLabel={t('next')} onPress={() => !last && go(at + 1)} style={{ flex: 1, justifyContent: 'center' }}>
            <T style={{ fontSize: 30, lineHeight: 42 }} weight={400}>
              {steps[at]}
            </T>
          </Pressable>

          {minutes !== null && (
            <Glass style={{ padding: 16 }}>
              <Row style={{ gap: 14 }}>
                <Circle
                  icon={running ? 'pause' : 'timer-outline'}
                  label={t('timer')}
                  kind="lime"
                  size={52}
                  onPress={() => {
                    if (left === null || left === 0) setLeft(minutes * 60);
                    setRunning(!running);
                  }}
                />
                <View style={{ flex: 1 }}>
                  <T kind="small" dim>
                    {t('timer')}
                  </T>
                  <T kind="display" style={{ fontSize: 40, lineHeight: 44 }}>
                    {clock(left ?? minutes * 60)}
                  </T>
                </View>
                {left !== null && (
                  <Circle
                    icon="refresh"
                    label={t('regenerate')}
                    kind="glass"
                    size={44}
                    onPress={() => {
                      setRunning(false);
                      setLeft(minutes * 60);
                    }}
                  />
                )}
              </Row>
            </Glass>
          )}

          <Row style={{ gap: 10 }}>
            <Button label={t('back')} kind="glass" icon="chevron-back" onPress={() => go(at - 1)} disabled={at === 0} style={{ flex: 1 }} />
            {last ? (
              <Button label={t('done')} icon="checkmark" onPress={() => router.back()} style={{ flex: 1.4 }} />
            ) : (
              <Button label={t('next')} kind="white" icon="chevron-forward" onPress={() => go(at + 1)} style={{ flex: 1.4 }} />
            )}
          </Row>
        </View>
      </SafeAreaView>
    </View>
  );
}
