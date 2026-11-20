import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';

import { signOut, useSession } from '@/auth';
import { Stepper } from '@/components/stepper';
import { Button, C, Chip, Circle, DishRow, Glass, Headline, Row, Screen, T, TopBar, photoOf } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { CUISINE_LABEL, DIET_LABEL, HOME_STYLES, LANGS, SPICE_LABEL, nameIn, toggleStyle } from '@/lib/i18n.ts';
import type { Diet, Profile, SpiceLevel } from '@/lib/types.ts';
import { cancelMorningMenu, scheduleMorningMenu } from '@/notify';
import { leaveGuest, newWeek, resetAll, setProfile, setReminder, setSimple, toggleDislike, useApp, useT } from '@/state';

const DIETS: Diet[] = ['veg', 'jain', 'egg', 'nonveg'];
const SPICES: SpiceLevel[] = ['low', 'medium', 'high'];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Glass style={{ padding: 18, gap: 14 }}>
      <T kind="h2">{title}</T>
      {children}
    </Glass>
  );
}

function Wrap({ children }: { children: ReactNode }) {
  return <Row style={{ flexWrap: 'wrap', gap: 8 }}>{children}</Row>;
}

/** Native confirm dialog; the browser's confirm on web. */
function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: '✕', style: 'cancel' },
    { text: title, style: 'destructive', onPress: onYes },
  ]);
}

export default function Settings() {
  const { profile, simple, reminder } = useApp();
  const p = profile!;
  const t = useT();
  const { session } = useSession();
  const up = (patch: Partial<Profile>, replan = false) => {
    setProfile({ ...p, ...patch });
    if (replan) newWeek();
  };

  return (
    <Screen photo={photoOf('undhiyu')}>
      <TopBar
        left={<Circle icon="chevron-back" label={t('back')} onPress={() => router.navigate('/')} />}
        title={t('settings')}
        right={<Circle icon="person" label={t('account')} kind="glass" />}
      />

      <Headline a={t('settingsA')} b={t('settingsB')} />

      <Glass style={{ padding: 18 }}>
        <Row style={{ gap: 14 }}>
          <Circle icon="accessibility-outline" label={t('simpleMode')} kind="lime" size={44} />
          <View style={{ flex: 1 }}>
            <T kind="label">{t('simpleMode')}</T>
            <T kind="small" dim>
              {t('simpleHint')}
            </T>
          </View>
          <Switch value={simple} onValueChange={setSimple} trackColor={{ true: C.accent, false: 'rgba(255,255,255,0.2)' }} thumbColor={C.white} accessibilityLabel={t('simpleMode')} />
        </Row>
      </Glass>

      <Glass style={{ padding: 18 }}>
        <Row style={{ gap: 14 }}>
          <Circle icon="notifications-outline" label={t('reminder')} kind="glass" size={44} />
          <View style={{ flex: 1 }}>
            <T kind="label">{t('reminder')}</T>
            <T kind="small" dim>
              {t('reminderHint')}
            </T>
          </View>
          <Switch
            value={reminder}
            onValueChange={async (on) => {
              const ok = on ? await scheduleMorningMenu(8, t('reminderTitle'), t('reminderBody')) : (await cancelMorningMenu(), true);
              setReminder(on && ok);
            }}
            trackColor={{ true: C.accent, false: 'rgba(255,255,255,0.2)' }}
            thumbColor={C.white}
            accessibilityLabel={t('reminder')}
          />
        </Row>
      </Glass>

      <Glass style={{ padding: 18 }}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/family')}>
          <Row style={{ gap: 14 }}>
            <Circle icon="people" label={t('familyA')} size={44} />
            <View style={{ flex: 1 }}>
              <T kind="label">
                {t('familyA')} {t('familyB')}
              </T>
              <T kind="small" dim>
                {t('familyHint')}
              </T>
            </View>
          </Row>
        </Pressable>
      </Glass>

      <Group title={t('language')}>
        <Wrap>
          {LANGS.map((l) => (
            <Chip key={l.id} label={l.label} on={p.lang === l.id} onPress={() => up({ lang: l.id })} />
          ))}
        </Wrap>
      </Group>

      <Group title={t('diet')}>
        <Wrap>
          {DIETS.map((d) => (
            <Chip key={d} label={nameIn(DIET_LABEL[d], p.lang)} on={p.diet === d} onPress={() => up({ diet: d }, true)} />
          ))}
        </Wrap>
      </Group>

      <Group title={t('region')}>
        <T kind="small" dim>
          {t('pickAll')}
        </T>
        <Wrap>
          {HOME_STYLES.map((r) => (
            <Chip
              key={r}
              icon={p.regions.includes(r) ? 'checkmark' : undefined}
              label={nameIn(CUISINE_LABEL[r], p.lang)}
              on={p.regions.includes(r)}
              onPress={() => up({ regions: toggleStyle(p.regions, r) }, true)}
            />
          ))}
        </Wrap>
      </Group>

      <Glass style={{ padding: 18 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T kind="h2" style={{ flex: 1 }}>
            {t('people')}
          </T>
          <Stepper value={p.people} min={1} max={30} onChange={(people) => up({ people })} />
        </Row>
      </Glass>

      <Group title={t('spice')}>
        <Wrap>
          {SPICES.map((s, i) => (
            <Chip key={s} label={`${'🌶'.repeat(i + 1)} ${nameIn(SPICE_LABEL[s], p.lang)}`} on={p.spice === s} onPress={() => up({ spice: s })} />
          ))}
        </Wrap>
      </Group>

      {p.dislikes.length > 0 && (
        <Group title={t('notAFan')}>
          <T kind="small" dim>
            {t('dislikedNote')}
          </T>
          {p.dislikes.map((id) => {
            const d = DISH_BY_ID.get(id);
            return d ? <DishRow key={id} dish={d} right={<Circle icon="close" label={t('stop')} kind="glass" size={36} onPress={() => toggleDislike(id)} />} /> : null;
          })}
        </Group>
      )}

      <Group title={t('account')}>
        {session ? (
          <>
            <T dim>
              {t('signedInAs')}: {session.user.email}
            </T>
            <Button label={t('signOut')} kind="glass" icon="log-out-outline" onPress={signOut} />
          </>
        ) : (
          <>
            <T dim>{t('guestNote')}</T>
            <Button label={t('signIn')} kind="white" icon="log-in-outline" onPress={leaveGuest} />
          </>
        )}
      </Group>

      <View>
        <Button
          label={t('reset')}
          kind="glass"
          icon="trash-outline"
          onPress={() =>
            confirm(t('reset'), t('resetWarn'), () => {
              resetAll();
              router.replace('/');
            })
          }
        />
      </View>
    </Screen>
  );
}
