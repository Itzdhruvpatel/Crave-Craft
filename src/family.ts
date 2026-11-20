import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/auth';
import { tr, type StrKey } from '@/lib/i18n.ts';
import type { DayPlan } from '@/lib/planner.ts';
import type { Lang, Rating } from '@/lib/types.ts';

// Family Table data, backed by Supabase (see supabase/schema.sql). Row level security on the
// server decides who sees what; this file only reads and writes.

export type Role = 'hod' | 'member';
export interface Family {
  id: string;
  name: string;
  invite_code: string;
  /** when tonight's hidden menu opens; members can't read hidden menu rows, so the time lives here */
  surprise_at: string | null;
}
export interface Member {
  user_id: string;
  display_name: string;
  role: Role;
  mute_chat: boolean;
}
export interface MenuDay {
  day: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  fast: boolean;
  hidden_until: string | null;
}
export interface Message {
  id: number;
  user_id: string;
  body: string | null;
  dish_id: string | null;
  voice_path: string | null;
  photo_path: string | null;
  created_at: string;
}
export interface Reaction {
  message_id: number;
  user_id: string;
  emoji: string;
}
export interface FamilyRating {
  user_id: string;
  dish_id: string;
  rating: Rating;
}
export interface Thanks {
  user_id: string;
  day: string;
}
export interface Poll {
  id: number;
  question: string;
  dish_ids: string[];
  closes_at: string;
  winner: string | null;
}
export interface Vote {
  poll_id: number;
  user_id: string;
  dish_id: string;
}
export interface Petition {
  id: number;
  user_id: string;
  dish_id: string;
  meal: string | null;
  for_day: string | null;
  bribe: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'later';
  /** an approved bribe has been paid back (onions chopped, dishes washed) */
  paid: boolean;
  created_at: string;
}
export interface Attendance {
  user_id: string;
  meal: string;
  eating: boolean;
}

function db() {
  if (!supabase) throw new Error('Family server is not connected yet');
  return supabase;
}

async function check<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

export async function createFamily(name: string, hodName: string, lang: string): Promise<string> {
  return check(db().rpc('create_family', { family_name: name, hod_name: hodName, hod_lang: lang }));
}

export async function joinFamily(code: string, name: string, lang: string): Promise<string> {
  return check(db().rpc('join_family', { code: code.trim().toUpperCase(), name, member_lang: lang }));
}

export async function leaveFamily(familyId: string, userId: string) {
  await check(db().from('members').delete().eq('family_id', familyId).eq('user_id', userId));
}

/** HOD shares this week's plan. `hiddenUntil` keeps a day secret until that time (surprise mode). */
export async function publishWeek(familyId: string, plan: DayPlan[], userId: string, hidden?: { day: string; until: string }) {
  const rows = plan.map((d) => ({
    family_id: familyId,
    day: d.date,
    breakfast: d.breakfast,
    lunch: d.lunch,
    dinner: d.dinner,
    fast: d.fast,
    hidden_until: hidden && hidden.day === d.date ? hidden.until : null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }));
  await check(db().from('menus').upsert(rows));
  await check(db().from('families').update({ surprise_at: hidden?.until ?? null }).eq('id', familyId));
  pushFamily(familyId, userId, 'menuShared', hidden ? '🎁' : '🍽️', 'family');
}

export async function sendMessage(familyId: string, userId: string, body: string, dishId?: string) {
  await check(db().from('messages').insert({ family_id: familyId, user_id: userId, body, dish_id: dishId ?? null }));
  pushFamily(familyId, userId, 'newMessage', body, 'chat');
}

/** Uploads a recorded voice note or picked photo into the family's private folder, then posts it. */
export async function sendMedia(familyId: string, userId: string, uri: string, kind: 'voice' | 'photo') {
  const web = Platform.OS === 'web';
  const ext = kind === 'photo' ? 'jpg' : web ? 'webm' : 'm4a';
  const type = kind === 'photo' ? 'image/jpeg' : web ? 'audio/webm' : 'audio/mp4';
  const path = `${familyId}/${Date.now()}-${userId.slice(0, 8)}.${ext}`;
  const bytes = await (await fetch(uri)).arrayBuffer();
  await check(db().storage.from('family').upload(path, bytes, { contentType: type }));
  const media = kind === 'voice' ? { voice_path: path } : { photo_path: path };
  await check(db().from('messages').insert({ family_id: familyId, user_id: userId, ...media }));
  pushFamily(familyId, userId, 'newMessage', kind === 'voice' ? '🎤' : '📷', 'chat');
}

/** Short-lived link to a family file; the bucket is private. */
export async function fileUrl(path: string): Promise<string> {
  const link = await check(db().storage.from('family').createSignedUrl(path, 3600));
  if (!link) throw new Error('File not found');
  return link.signedUrl;
}

/** Same emoji again removes it; a different one replaces it. */
export async function react(familyId: string, userId: string, messageId: number, emoji: string, current?: string) {
  if (current === emoji) await check(db().from('reactions').delete().eq('message_id', messageId).eq('user_id', userId));
  else await check(db().from('reactions').upsert({ message_id: messageId, family_id: familyId, user_id: userId, emoji }));
}

export async function setMuteChat(familyId: string, userId: string, mute: boolean) {
  await check(db().from('members').update({ mute_chat: mute }).eq('family_id', familyId).eq('user_id', userId));
}

let cachedFamily: { user: string; family: string | null } | null = null;
async function myFamily(): Promise<{ user: string; family: string } | null> {
  if (!supabase) return null;
  const user = (await supabase.auth.getSession()).data.session?.user.id;
  if (!user) return null;
  if (cachedFamily?.user !== user || !cachedFamily.family) {
    const rows = await check(supabase.from('members').select('family_id').eq('user_id', user).limit(1));
    cachedFamily = { user, family: (rows?.[0]?.family_id as string | undefined) ?? null };
  }
  return cachedFamily.family ? { user, family: cachedFamily.family } : null;
}

/** Posts to the family chat from anywhere in the app (dadi's voice). False when not in a family. */
export async function sayToFamily(body: string, dishId?: string): Promise<boolean> {
  const me = await myFamily().catch(() => null);
  if (!me) return false;
  await sendMessage(me.family, me.user, body, dishId);
  return true;
}

/** Copies a rating to the family table when this phone is in one. Silent when offline. */
export async function shareRating(dishId: string, rating: Rating | null) {
  const me = await myFamily().catch(() => null);
  if (!me) return;
  const mine = db().from('ratings');
  if (rating === null) await mine.delete().eq('family_id', me.family).eq('user_id', me.user).eq('dish_id', dishId);
  else await mine.upsert({ family_id: me.family, user_id: me.user, dish_id: dishId, rating, updated_at: new Date().toISOString() });
}

export async function shareThanks(day: string) {
  const me = await myFamily().catch(() => null);
  if (!me) return;
  await db().from('thanks').upsert({ family_id: me.family, user_id: me.user, day });
  pushFamily(me.family, me.user, 'thankMummy', '❤️', 'family');
}

/** Saves this phone's push address so the family can reach it when the app is closed. */
export async function registerPush(familyId: string, userId: string) {
  if (Platform.OS === 'web') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted && !(await Notifications.requestPermissionsAsync()).granted) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await check(db().from('members').update({ push_token: token }).eq('family_id', familyId).eq('user_id', userId));
}

/**
 * Push alert to everyone else in the family, each in their own language.
 * Goes straight to Expo's push service; browsers block that call, so web senders skip it.
 */
export async function pushFamily(familyId: string, fromUser: string, title: StrKey, body: string, kind: 'chat' | 'family') {
  if (Platform.OS === 'web' || !supabase) return;
  try {
    const rows = await check(supabase.from('members').select('user_id,push_token,lang,mute_chat').eq('family_id', familyId));
    const to = (rows as { user_id: string; push_token: string | null; lang: Lang; mute_chat: boolean }[]).filter(
      (m) => m.user_id !== fromUser && m.push_token && !(kind === 'chat' && m.mute_chat),
    );
    if (!to.length) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(to.map((m) => ({ to: m.push_token, title: tr(m.lang, title), body: body.slice(0, 120), sound: 'default' }))),
    });
  } catch {
    // A missed alert is fine: the change is saved and shows up live in the app.
  }
}

export async function createPoll(familyId: string, userId: string, question: string, dishIds: string[], hours = 3) {
  const closes = new Date(Date.now() + hours * 3600_000).toISOString();
  await check(db().from('polls').insert({ family_id: familyId, created_by: userId, question, dish_ids: dishIds, closes_at: closes }));
  pushFamily(familyId, userId, 'newPollAlert', question, 'family');
}

export async function vote(pollId: number, userId: string, dishId: string) {
  await check(db().from('poll_votes').upsert({ poll_id: pollId, user_id: userId, dish_id: dishId }));
}

export async function closePoll(pollId: number, winner: string) {
  await check(db().from('polls').update({ winner, closes_at: new Date().toISOString() }).eq('id', pollId));
}

export async function filePetition(familyId: string, userId: string, dishId: string, meal: string, forDay: string, bribe: string) {
  await check(db().from('petitions').insert({ family_id: familyId, user_id: userId, dish_id: dishId, meal, for_day: forDay, bribe }));
  pushFamily(familyId, userId, 'newPetition', bribe, 'family');
}

export async function payBribe(id: number) {
  await check(db().rpc('pay_bribe', { petition: id }));
}

export async function decidePetition(id: number, status: Petition['status']) {
  await check(db().from('petitions').update({ status, decided_at: new Date().toISOString() }).eq('id', id));
}

export async function markEating(familyId: string, userId: string, day: string, meal: string, eating: boolean) {
  await check(db().from('attendance').upsert({ family_id: familyId, user_id: userId, day, meal, eating }));
}

export interface FamilyData {
  family: Family | null;
  members: Member[];
  menu: MenuDay[];
  messages: Message[];
  polls: Poll[];
  votes: Vote[];
  petitions: Petition[];
  attendance: Attendance[];
  reactions: Reaction[];
  ratings: FamilyRating[];
  thanks: Thanks[];
}

const EMPTY: FamilyData = { family: null, members: [], menu: [], messages: [], polls: [], votes: [], petitions: [], attendance: [], reactions: [], ratings: [], thanks: [] };

/**
 * Everything for the signed-in user's family, kept live with Supabase Realtime.
 * `onEvent` fires for changes made by other people, for in-app alerts.
 */
export function useFamily(userId: string | undefined, today: string, onEvent?: (kind: 'message' | 'menu' | 'poll' | 'petition') => void) {
  const [data, setData] = useState<FamilyData>(EMPTY);
  const [loading, setLoading] = useState(!!supabase && !!userId);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !userId) return;
    try {
      const mine = await check(supabase.from('members').select('family_id').eq('user_id', userId).limit(1));
      const familyId = mine?.[0]?.family_id as string | undefined;
      if (!familyId) {
        setData(EMPTY);
        return;
      }
      const [family, members, menu, messages, polls, petitions, attendance, reactions, ratings, thanks] = await Promise.all([
        check(supabase.from('families').select('id,name,invite_code,surprise_at').eq('id', familyId).single()),
        check(supabase.from('members').select('user_id,display_name,role,mute_chat').eq('family_id', familyId)),
        check(supabase.from('menus').select('day,breakfast,lunch,dinner,fast,hidden_until').eq('family_id', familyId).gte('day', today).order('day')),
        check(supabase.from('messages').select('id,user_id,body,dish_id,voice_path,photo_path,created_at').eq('family_id', familyId).order('created_at', { ascending: false }).limit(60)),
        check(supabase.from('polls').select('id,question,dish_ids,closes_at,winner').eq('family_id', familyId).order('id', { ascending: false }).limit(10)),
        check(supabase.from('petitions').select('id,user_id,dish_id,meal,for_day,bribe,status,paid,created_at').eq('family_id', familyId).order('id', { ascending: false }).limit(30)),
        check(supabase.from('attendance').select('user_id,meal,eating').eq('family_id', familyId).eq('day', today)),
        check(supabase.from('reactions').select('message_id,user_id,emoji').eq('family_id', familyId)),
        check(supabase.from('ratings').select('user_id,dish_id,rating').eq('family_id', familyId)),
        check(supabase.from('thanks').select('user_id,day').eq('family_id', familyId).order('day', { ascending: false }).limit(400)),
      ]);
      const pollIds = (polls as Poll[]).map((p) => p.id);
      const votes = pollIds.length ? await check(supabase.from('poll_votes').select('poll_id,user_id,dish_id').in('poll_id', pollIds)) : [];
      setData({
        family: family as Family,
        members: members as Member[],
        menu: menu as MenuDay[],
        messages: (messages as Message[]).reverse(),
        polls: polls as Poll[],
        votes: votes as Vote[],
        petitions: petitions as Petition[],
        attendance: attendance as Attendance[],
        reactions: reactions as Reaction[],
        ratings: ratings as FamilyRating[],
        thanks: thanks as Thanks[],
      });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  // Fetch after mount; state only changes once the server answers.
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const familyId = data.family?.id;
  useEffect(() => {
    if (!supabase || !familyId) return;
    const filter = `family_id=eq.${familyId}`;
    const ch = supabase.channel(`family-${familyId}`);
    const watch = (table: string, kind?: 'message' | 'menu' | 'poll' | 'petition') =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table, filter }, (payload) => {
        const row = (payload.new ?? {}) as { user_id?: string; updated_by?: string; created_by?: string };
        const by = row.user_id ?? row.updated_by ?? row.created_by;
        if (kind && by !== userId) onEvent?.(kind);
        load();
      });
    watch('messages', 'message');
    watch('menus', 'menu');
    watch('polls', 'poll');
    watch('petitions', 'petition');
    watch('attendance');
    watch('reactions');
    watch('ratings');
    watch('thanks');
    // Votes have no family column; the server's row rules only send this family's votes.
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => load());
    ch.subscribe();
    return () => {
      supabase?.removeChannel(ch);
    };
  }, [familyId, userId, load, onEvent]);

  const me = data.members.find((m) => m.user_id === userId);
  return { ...data, me, isHod: me?.role === 'hod', loading, error, reload: load };
}
