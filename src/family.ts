import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/auth';
import type { DayPlan } from '@/lib/planner.ts';

// Family Table data, backed by Supabase (see supabase/schema.sql). Row level security on the
// server decides who sees what; this file only reads and writes.

export type Role = 'hod' | 'member';
export interface Family {
  id: string;
  name: string;
  invite_code: string;
}
export interface Member {
  user_id: string;
  display_name: string;
  role: Role;
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
  created_at: string;
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
}

export async function sendMessage(familyId: string, userId: string, body: string, dishId?: string) {
  await check(db().from('messages').insert({ family_id: familyId, user_id: userId, body, dish_id: dishId ?? null }));
}

export async function createPoll(familyId: string, userId: string, question: string, dishIds: string[], hours = 3) {
  const closes = new Date(Date.now() + hours * 3600_000).toISOString();
  await check(db().from('polls').insert({ family_id: familyId, created_by: userId, question, dish_ids: dishIds, closes_at: closes }));
}

export async function vote(pollId: number, userId: string, dishId: string) {
  await check(db().from('poll_votes').upsert({ poll_id: pollId, user_id: userId, dish_id: dishId }));
}

export async function closePoll(pollId: number, winner: string) {
  await check(db().from('polls').update({ winner, closes_at: new Date().toISOString() }).eq('id', pollId));
}

export async function filePetition(familyId: string, userId: string, dishId: string, meal: string, forDay: string, bribe: string) {
  await check(db().from('petitions').insert({ family_id: familyId, user_id: userId, dish_id: dishId, meal, for_day: forDay, bribe }));
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
}

const EMPTY: FamilyData = { family: null, members: [], menu: [], messages: [], polls: [], votes: [], petitions: [], attendance: [] };

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
      const [family, members, menu, messages, polls, petitions, attendance] = await Promise.all([
        check(supabase.from('families').select('id,name,invite_code').eq('id', familyId).single()),
        check(supabase.from('members').select('user_id,display_name,role').eq('family_id', familyId)),
        check(supabase.from('menus').select('day,breakfast,lunch,dinner,fast,hidden_until').eq('family_id', familyId).gte('day', today).order('day')),
        check(supabase.from('messages').select('id,user_id,body,dish_id,created_at').eq('family_id', familyId).order('created_at', { ascending: false }).limit(60)),
        check(supabase.from('polls').select('id,question,dish_ids,closes_at,winner').eq('family_id', familyId).order('id', { ascending: false }).limit(10)),
        check(supabase.from('petitions').select('id,user_id,dish_id,meal,for_day,bribe,status,created_at').eq('family_id', familyId).order('id', { ascending: false }).limit(30)),
        check(supabase.from('attendance').select('user_id,meal,eating').eq('family_id', familyId).eq('day', today)),
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
