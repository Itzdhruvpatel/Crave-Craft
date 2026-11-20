import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Switch, TextInput, View } from 'react-native';

import { authReady, useSession } from '@/auth';
import { Button, C, Chip, Circle, DishPhoto, DishRow, Glass, Headline, Row, Screen, T, TopBar, photoOf, useLang } from '@/components/ui';
import { Qr } from '@/components/qr';
import { font } from '@/constants/fonts';
import { DISHES, DISH_BY_ID } from '@/data/dishes/index.ts';
import {
  closePoll,
  createFamily,
  createPoll,
  decidePetition,
  filePetition,
  joinFamily,
  markEating,
  payBribe,
  publishWeek,
  sendMessage,
  useFamily,
  vote,
  type Petition,
} from '@/family';
import { nameIn, type StrKey } from '@/lib/i18n.ts';
import { fitsDiet } from '@/lib/nutrition.ts';
import { SLOTS, isoDate, type Slot } from '@/lib/planner.ts';
import { clock } from '@/lib/timer.ts';
import type { Diet } from '@/lib/types.ts';
import { notifyNow } from '@/notify';
import { leaveGuest, setGuess, useApp, useT } from '@/state';

type Tab = 'today' | 'polls' | 'petitions' | 'chat';

function Field({ value, onChange, placeholder, upper }: { value: string; onChange: (v: string) => void; placeholder: string; upper?: boolean }) {
  const lang = useLang();
  return (
    <Glass radius={18}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        autoCapitalize={upper ? 'characters' : 'words'}
        accessibilityLabel={placeholder}
        style={{ color: C.text, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, fontFamily: font(lang, 400) }}
      />
    </Glass>
  );
}

export default function FamilyScreen() {
  const { profile, plan } = useApp();
  const t = useT();
  const { session } = useSession();
  const userId = session?.user.id;
  const today = isoDate(new Date());
  const [tab, setTab] = useState<Tab>('today');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const alert = useCallback(
    (kind: 'message' | 'menu' | 'poll' | 'petition') => {
      const title = { message: t('newMessage'), menu: t('menuShared'), poll: t('newPollAlert'), petition: t('newPetition') }[kind];
      notifyNow(title, `${t('familyA')} ${t('familyB')}`);
    },
    [t],
  );
  const fam = useFamily(userId, today, alert);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setNote('');
    try {
      await fn();
      if (done) setNote(done);
      await fam.reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const back = <Circle icon="chevron-back" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
  const todayMenu = fam.menu.find((m) => m.day === today);
  const heroId = todayMenu?.lunch[0];

  // Not set up, or not signed in: explain plainly what's needed.
  if (!authReady || !userId) {
    return (
      <Screen photo={photoOf('undhiyu')} tabs={false}>
        <TopBar left={back} title={`${t('familyA')} ${t('familyB')}`} />
        <Headline a={t('familyA')} b={t('familyB')} />
        <Glass style={{ padding: 20, gap: 16 }}>
          <T>{!authReady ? t('serverOff') : t('signInFirst')}</T>
          {authReady && <Button label={t('signIn')} kind="white" icon="log-in-outline" onPress={leaveGuest} />}
        </Glass>
        <Glass style={{ padding: 20, gap: 10 }}>
          <T dim>{t('familyHint')}</T>
        </Glass>
      </Screen>
    );
  }

  if (!fam.loading && !fam.family) return <Setup busy={busy} note={note} run={run} back={back} />;

  return (
    <Screen photo={photoOf(heroId ?? 'gujarati_dal')} tabs={false}>
      <TopBar
        left={back}
        title={fam.family?.name}
        right={
          fam.family ? (
            <Circle
              icon="share-social-outline"
              label={t('inviteCode')}
              kind="glass"
              onPress={() => Share.share({ message: `${t('inviteMsg')} ${fam.family!.invite_code}
${Linking.createURL(`join/${fam.family!.invite_code}`)}` })}
            />
          ) : undefined
        }
      />
      <Headline a={t('familyA')} b={t('familyB')} side={fam.isHod ? t('hod') : undefined} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['today', 'polls', 'petitions', 'chat'] as Tab[]).map((k) => (
          <Chip key={k} label={k === 'today' ? t('today') : t(k)} on={tab === k} onPress={() => setTab(k)} />
        ))}
      </ScrollView>

      {note ? (
        <Glass style={{ padding: 14 }}>
          <T kind="small">{note}</T>
        </Glass>
      ) : null}
      {fam.error ? (
        <Glass style={{ padding: 14 }}>
          <T kind="small" color={C.warn}>
            {fam.error}
          </T>
        </Glass>
      ) : null}

      {tab === 'today' && <TodayTab fam={fam} plan={plan} userId={userId} today={today} busy={busy} run={run} />}
      {tab === 'polls' && <PollsTab fam={fam} userId={userId} diet={profile!.diet} busy={busy} run={run} />}
      {tab === 'petitions' && <PetitionsTab fam={fam} userId={userId} diet={profile!.diet} today={today} busy={busy} run={run} />}
      {tab === 'chat' && <ChatTab fam={fam} userId={userId} run={run} />}

      <Glass style={{ padding: 18, gap: 8 }}>
        <T kind="small" dim>
          {t('inviteShare')}
        </T>
        <T kind="display" style={{ letterSpacing: 6 }} weight={600}>
          {fam.family?.invite_code}
        </T>
        {fam.family && <Qr value={Linking.createURL(`join/${fam.family.invite_code}`)} />}
        <T kind="small" dim>
          {t('scanToJoin')}
        </T>
        <T kind="small" dim>
          {fam.members.map((m) => m.display_name).join(', ')}
        </T>
      </Glass>
    </Screen>
  );
}

type Fam = ReturnType<typeof useFamily>;
type Run = (fn: () => Promise<unknown>, done?: string) => Promise<void>;

function Setup({ busy, note, run, back }: { busy: boolean; note: string; run: Run; back: React.ReactNode }) {
  const t = useT();
  const lang = useLang();
  // Arriving from an invite QR or link: open on Join with the code filled in.
  const invited = useLocalSearchParams<{ code?: string }>().code?.toUpperCase() ?? '';
  const [mode, setMode] = useState<'create' | 'join'>(invited ? 'join' : 'create');
  const [familyName, setFamilyName] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState(invited);
  return (
    <Screen photo={photoOf('undhiyu')} tabs={false}>
      <TopBar left={back} title={`${t('familyA')} ${t('familyB')}`} />
      <Headline a={t('familyA')} b={t('familyB')} />
      <T dim>{t('familyHint')}</T>
      <Row style={{ gap: 8 }}>
        <Chip label={t('createFamily')} on={mode === 'create'} onPress={() => setMode('create')} />
        <Chip label={t('joinFamily')} on={mode === 'join'} onPress={() => setMode('join')} />
      </Row>
      <Glass style={{ padding: 18, gap: 12 }}>
        <Field value={name} onChange={setName} placeholder={t('yourName')} />
        {mode === 'create' ? (
          <Field value={familyName} onChange={setFamilyName} placeholder={t('familyName')} />
        ) : (
          <Field value={code} onChange={setCode} placeholder={t('inviteCode')} upper />
        )}
        <Button
          label={mode === 'create' ? t('createFamily') : t('joinFamily')}
          disabled={busy || !name.trim() || (mode === 'create' ? !familyName.trim() : code.trim().length < 6)}
          onPress={() => run(() => (mode === 'create' ? createFamily(familyName.trim(), name.trim(), lang) : joinFamily(code, name.trim(), lang)))}
        />
        {note ? <T kind="small" color={C.warn}>{note}</T> : null}
      </Glass>
    </Screen>
  );
}

/** Ticks every second until `until`, then calls `onDone` once. */
function Countdown({ until, onDone }: { until: string; onDone: () => void }) {
  const t = useT();
  const [now, setNow] = useState(Date.now);
  const left = (new Date(until).getTime() - now) / 1000;
  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const id = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [left, onDone]);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <T kind="small" dim>
        🎁 {t('revealIn')}
      </T>
      <T kind="display" color={C.accent}>
        {clock(left)}
      </T>
    </View>
  );
}

function GuessCard({ today, revealed }: { today: string; revealed?: string[] }) {
  const t = useT();
  const lang = useLang();
  const { profile, guesses } = useApp();
  const guess = guesses[today];
  const name = guess && DISH_BY_ID.get(guess) ? nameIn(DISH_BY_ID.get(guess)!.name, lang) : '';
  if (revealed) {
    if (!guess) return null;
    return (
      <T kind="label" color={revealed.includes(guess) ? C.accent : C.textSecondary}>
        {revealed.includes(guess) ? `🎉 ${t('guessedRight')}` : `${t('guessedWrong')}: ${t('yourGuess')} ${name}`}
      </T>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <T kind="h2">🤔 {t('guessDish')}</T>
      {guess ? (
        <T dim>
          {t('yourGuess')}: {name}
        </T>
      ) : null}
      <DishPicker diet={profile!.diet} picked={guess ? [guess] : []} onToggle={(id) => setGuess(today, id)} max={1} />
    </View>
  );
}

function TodayTab({ fam, plan, userId, today, busy, run }: { fam: Fam; plan: ReturnType<typeof useApp>['plan']; userId: string; today: string; busy: boolean; run: Run }) {
  const t = useT();
  const lang = useLang();
  const [surprise, setSurprise] = useState(false);
  const day = fam.menu.find((m) => m.day === today);
  const hidden = day?.hidden_until && new Date(day.hidden_until) > new Date();
  const surpriseAt = fam.family?.surprise_at && new Date(fam.family.surprise_at) > new Date() ? fam.family.surprise_at : null;

  const share = () => {
    if (!fam.family || !plan) return;
    const until = new Date();
    until.setHours(19, 30, 0, 0);
    return run(() => publishWeek(fam.family!.id, plan, userId, surprise ? { day: today, until: until.toISOString() } : undefined), t('published'));
  };

  const mine = (meal: Slot) => fam.attendance.find((a) => a.user_id === userId && a.meal === meal)?.eating;
  const count = (meal: Slot) => fam.attendance.filter((a) => a.meal === meal && a.eating).length;

  return (
    <View style={{ gap: 16 }}>
      {fam.isHod && (
        <Glass style={{ padding: 18, gap: 14 }}>
          <Row style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T kind="label">🎁 {t('surprise')}</T>
              <T kind="small" dim>
                {t('surpriseHint')}
              </T>
            </View>
            <Switch value={surprise} onValueChange={setSurprise} trackColor={{ true: C.accent, false: 'rgba(255,255,255,0.2)' }} thumbColor={C.white} accessibilityLabel={t('surprise')} />
          </Row>
          <Button label={t('publishWeek')} icon="paper-plane" onPress={share} disabled={busy || !plan} />
        </Glass>
      )}

      {!day && surpriseAt && !fam.isHod ? (
        <Glass style={{ padding: 18, gap: 18 }}>
          <Countdown until={surpriseAt} onDone={fam.reload} />
          <GuessCard today={today} />
        </Glass>
      ) : !day ? (
        <Glass style={{ padding: 18 }}>
          <T dim>{t('notShared')}</T>
        </Glass>
      ) : (
        SLOTS.map((s) => {
          const secret = s === 'dinner' && hidden && !fam.isHod;
          return (
            <Glass key={s} style={{ padding: 18, gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T kind="h2">{t(s)}</T>
                <T kind="small" dim>
                  {count(s)} {t('eatingCount')}
                </T>
              </Row>
              {secret ? (
                <T>
                  🎁 {t('hiddenTill')} {new Date(day.hidden_until!).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' })}
                </T>
              ) : (
                day[s].map((id) => DISH_BY_ID.get(id) && <DishRow key={id} dish={DISH_BY_ID.get(id)!} />)
              )}
              {s === 'dinner' && hidden && fam.isHod && <Countdown until={day.hidden_until!} onDone={fam.reload} />}
              {s === 'dinner' && !hidden && <GuessCard today={today} revealed={day.dinner} />}
              <Row style={{ gap: 8 }}>
                <T kind="small" dim style={{ flex: 1 }}>
                  {t('eatingToday')}
                </T>
                <Chip label={t('yes')} on={mine(s) === true} onPress={() => run(() => markEating(fam.family!.id, userId, today, s, true))} />
                <Chip label={t('no')} on={mine(s) === false} onPress={() => run(() => markEating(fam.family!.id, userId, today, s, false))} />
              </Row>
            </Glass>
          );
        })
      )}
    </View>
  );
}

function DishPicker({ diet, picked, onToggle, max }: { diet: Diet; picked: string[]; onToggle: (id: string) => void; max: number }) {
  const lang = useLang();
  const [q, setQ] = useState('');
  const list = useMemo(
    () =>
      DISHES.filter((d) => fitsDiet(d, diet) && ['sabji', 'oneDish', 'breakfast', 'farsan', 'sweet'].includes(d.course))
        .filter((d) => !q || Object.values(d.name).some((n) => n?.toLowerCase().includes(q.toLowerCase())))
        .slice(0, 24),
    [diet, q],
  );
  return (
    <View style={{ gap: 10 }}>
      <Field value={q} onChange={setQ} placeholder="🔍" />
      <Row style={{ flexWrap: 'wrap', gap: 8 }}>
        {list.map((d) => (
          <Chip
            key={d.id}
            label={nameIn(d.name, lang)}
            on={picked.includes(d.id)}
            onPress={() => (picked.includes(d.id) || picked.length < max ? onToggle(d.id) : undefined)}
          />
        ))}
      </Row>
    </View>
  );
}

function PollsTab({ fam, userId, diet, busy, run }: { fam: Fam; userId: string; diet: Diet; busy: boolean; run: Run }) {
  const t = useT();
  const lang = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <View style={{ gap: 16 }}>
      {fam.isHod && (
        <Glass style={{ padding: 18, gap: 12 }}>
          <T kind="h2">{t('newPoll')}</T>
          <T kind="small" dim>
            {t('pickDishes')}
          </T>
          <DishPicker diet={diet} picked={picked} onToggle={toggle} max={4} />
          <Button
            label={t('newPoll')}
            icon="stats-chart"
            disabled={busy || picked.length < 2}
            onPress={() => run(() => createPoll(fam.family!.id, userId, t('pollQ'), picked).then(() => setPicked([])))}
          />
        </Glass>
      )}

      {fam.polls.map((p) => {
        const open = !p.winner && new Date(p.closes_at) > new Date();
        const votes = fam.votes.filter((v) => v.poll_id === p.id);
        const myVote = votes.find((v) => v.user_id === userId)?.dish_id;
        const top = p.dish_ids.map((id) => ({ id, n: votes.filter((v) => v.dish_id === id).length })).sort((a, b) => b.n - a.n)[0];
        return (
          <Glass key={p.id} style={{ padding: 18, gap: 12 }}>
            <T kind="h2">{p.question}</T>
            {p.winner && (
              <Row style={{ gap: 10, justifyContent: 'space-between' }}>
                <T kind="label" color={C.accent} style={{ flex: 1 }}>
                  {t('winner')} {nameIn(DISH_BY_ID.get(p.winner)!.name, lang)}
                </T>
                {top && top.n > votes.filter((v) => v.dish_id === p.winner).length && <Stamp label={t('veto')} color="#FF6B6B" />}
              </Row>
            )}
            {p.dish_ids.map((id) => {
              const d = DISH_BY_ID.get(id);
              if (!d) return null;
              const n = votes.filter((v) => v.dish_id === id).length;
              const share = votes.length ? n / votes.length : 0;
              return (
                <View key={id}>
                  <Pressable accessibilityRole="button" disabled={!open} onPress={() => run(() => vote(p.id, userId, id))}>
                    <Row style={{ gap: 12 }}>
                      <DishPhoto dish={d} size={48} round />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <T kind="label" weight={myVote === id ? 600 : 400}>
                            {myVote === id ? '✓ ' : ''}
                            {nameIn(d.name, lang)}
                          </T>
                          <T kind="small" dim>
                            {n} {t('votes')}
                          </T>
                        </Row>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <View style={{ width: `${share * 100}%`, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
                        </View>
                      </View>
                    </Row>
                  </Pressable>
                  {fam.isHod && open && (
                    <Pressable accessibilityRole="button" onPress={() => run(() => closePoll(p.id, id))} style={{ alignSelf: 'flex-end', paddingTop: 6 }}>
                      <T kind="tiny" color={C.accent}>
                        {t('pickThis')}
                      </T>
                    </Pressable>
                  )}
                </View>
              );
            })}
            {fam.isHod && open && top && <Button label={t('closePoll')} kind="white" onPress={() => run(() => closePoll(p.id, top.id))} />}
          </Glass>
        );
      })}
    </View>
  );
}

function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ borderWidth: 2, borderColor: color, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: '-6deg' }] }}>
      <T kind="tiny" weight={700} color={color}>
        {label}
      </T>
    </View>
  );
}

function PetitionsTab({ fam, userId, diet, today, busy, run }: { fam: Fam; userId: string; diet: Diet; today: string; busy: boolean; run: Run }) {
  const t = useT();
  const lang = useLang();
  const [dish, setDish] = useState<string[]>([]);
  const [meal, setMeal] = useState<Slot>('dinner');
  const [bribe, setBribe] = useState('');
  const ideas = t('bribeIdeas').split('|');
  const nameOf = (uid: string) => fam.members.find((m) => m.user_id === uid)?.display_name ?? '';
  const due = fam.petitions.filter((p) => p.status === 'approved' && p.bribe && !p.paid);

  return (
    <View style={{ gap: 16 }}>
      {!fam.isHod && (
        <Glass style={{ padding: 18, gap: 12 }} tint="rgba(207,245,74,0.08)">
          <Headline a={t('petitionA')} b={t('petitionB')} size={26} />
          <T kind="small" dim>
            {t('petitionDish')}
          </T>
          <DishPicker diet={diet} picked={dish} onToggle={(id) => setDish(dish[0] === id ? [] : [id])} max={1} />
          <Row style={{ gap: 8 }}>
            {SLOTS.map((s) => (
              <Chip key={s} label={t(s)} on={meal === s} onPress={() => setMeal(s)} />
            ))}
          </Row>
          <T kind="small" dim>
            {t('bribe')}
          </T>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {ideas.map((b) => (
              <Chip key={b} label={b} on={bribe === b} onPress={() => setBribe(b)} />
            ))}
          </Row>
          <Field value={bribe} onChange={setBribe} placeholder={t('bribe')} />
          <Button
            label={t('filePetition')}
            icon="document-text-outline"
            disabled={busy || !dish[0]}
            onPress={() => run(() => filePetition(fam.family!.id, userId, dish[0], meal, today, bribe).then(() => setDish([])))}
          />
        </Glass>
      )}

      {due.length > 0 && (
        <Glass style={{ padding: 18, gap: 8 }} tint="rgba(255,193,90,0.10)">
          <T kind="h2">🧽 {t('bribesDue')}</T>
          {due.map((p) => (
            <T key={p.id} kind="small">
              {nameOf(p.user_id)}: {p.bribe}
            </T>
          ))}
        </Glass>
      )}

      {fam.petitions.map((p: Petition) => {
        const d = DISH_BY_ID.get(p.dish_id);
        if (!d) return null;
        const stamp = { pending: C.textSecondary, approved: C.accent, rejected: '#FF6B6B', later: C.warn }[p.status];
        return (
          <Glass key={p.id} style={{ padding: 18, gap: 10 }}>
            <Row style={{ gap: 12 }}>
              <DishPhoto dish={d} size={54} round />
              <View style={{ flex: 1 }}>
                <T kind="label">{nameIn(d.name, lang)}</T>
                <T kind="small" dim>
                  {nameOf(p.user_id)}
                  {p.meal ? ` · ${t(p.meal as Slot)}` : ''}
                </T>
              </View>
              <Stamp label={t(`status_${p.status}` as StrKey)} color={stamp} />
            </Row>
            {p.bribe ? (
              <Row style={{ gap: 8 }}>
                <T kind="small" style={{ flex: 1, textDecorationLine: p.paid ? 'line-through' : 'none' }}>
                  🤝 {p.bribe}
                </T>
                {p.status === 'approved' &&
                  (p.paid ? (
                    <T kind="tiny" color={C.accent}>
                      ✓ {t('bribePaid')}
                    </T>
                  ) : (fam.isHod || p.user_id === userId) ? (
                    <Chip label={t('markPaid')} onPress={() => run(() => payBribe(p.id))} />
                  ) : null)}
              </Row>
            ) : null}
            {fam.isHod && p.status === 'pending' && (
              <Row style={{ gap: 8 }}>
                <Button label={t('approve')} onPress={() => run(() => decidePetition(p.id, 'approved'))} style={{ flex: 1 }} />
                <Button label={t('later')} kind="glass" onPress={() => run(() => decidePetition(p.id, 'later'))} style={{ flex: 1 }} />
                <Button label={t('reject')} kind="glass" onPress={() => run(() => decidePetition(p.id, 'rejected'))} style={{ flex: 1 }} />
              </Row>
            )}
          </Glass>
        );
      })}
    </View>
  );
}

function ChatTab({ fam, userId, run }: { fam: Fam; userId: string; run: Run }) {
  const t = useT();
  const lang = useLang();
  const [text, setText] = useState('');
  const nameOf = (uid: string) => fam.members.find((m) => m.user_id === uid)?.display_name ?? '';
  const send = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    run(() => sendMessage(fam.family!.id, userId, body));
  };
  return (
    <View style={{ gap: 10 }}>
      {fam.messages.map((m) => {
        const mine = m.user_id === userId;
        return (
          <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
            <View
              style={{
                maxWidth: '82%',
                borderRadius: 20,
                borderTopRightRadius: mine ? 6 : 20,
                borderTopLeftRadius: mine ? 20 : 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: mine ? C.accent : 'rgba(40,43,37,0.75)',
              }}>
              {!mine && (
                <T kind="tiny" color={C.accent}>
                  {nameOf(m.user_id)}
                </T>
              )}
              <T color={mine ? C.ink : C.text}>{m.body}</T>
              <T kind="tiny" color={mine ? 'rgba(16,20,10,0.6)' : C.textDim}>
                {new Date(m.created_at).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' })}
              </T>
            </View>
          </View>
        );
      })}
      <Glass radius={999} style={{ marginTop: 6 }}>
        <Row style={{ paddingLeft: 18, paddingRight: 6, gap: 8 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('typeMessage')}
            placeholderTextColor={C.textDim}
            onSubmitEditing={send}
            accessibilityLabel={t('typeMessage')}
            style={{ flex: 1, color: C.text, paddingVertical: 14, fontSize: 16, fontFamily: font(lang, 400) }}
          />
          <Circle icon="send" label={t('send')} kind="lime" size={44} onPress={send} />
        </Row>
      </Glass>
    </View>
  );
}
