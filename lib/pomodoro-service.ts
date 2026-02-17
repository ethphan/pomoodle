import type { PomodoroSessionRow } from '@/types/database';

import { supabase } from '@/lib/supabase';

export const DEFAULT_FOCUS_SECONDS = 25 * 60;

export type StatsRange = 'day' | 'week' | 'month' | 'year';
export type StatsBar = {
  label: string;
  value: number;
};

const ACTIVE_STATUSES = ['created', 'running', 'paused'] as const;

function nowIso() {
  return new Date().toISOString();
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfWeek(date: Date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

function toLocalDate(dateString: string) {
  return new Date(dateString);
}

function getRangeBoundaries(range: StatsRange, anchor = new Date()) {
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (range === 'day') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'week') {
    return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
  }

  if (range === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function initializeBuckets(range: StatsRange, anchor = new Date()) {
  if (range === 'day') {
    return Array.from({ length: 24 }, (_v, i) => ({
      label: `${i}`.padStart(2, '0'),
      value: 0,
    }));
  }

  if (range === 'week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({ label, value: 0 }));
  }

  if (range === 'month') {
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_v, i) => ({
      label: `${i + 1}`,
      value: 0,
    }));
  }

  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((label) => ({
    label,
    value: 0,
  }));
}

function addToBucket(buckets: StatsBar[], range: StatsRange, completedAt: string) {
  const date = toLocalDate(completedAt);

  if (range === 'day') {
    buckets[date.getHours()].value += 1;
    return;
  }

  if (range === 'week') {
    const day = date.getDay();
    const index = day === 0 ? 6 : day - 1;
    buckets[index].value += 1;
    return;
  }

  if (range === 'month') {
    buckets[date.getDate() - 1].value += 1;
    return;
  }

  buckets[date.getMonth()].value += 1;
}

function elapsedSeconds(session: PomodoroSessionRow, now: Date) {
  if (session.status === 'created') return 0;

  const pausedSeconds = session.paused_total_sec;
  if (session.status === 'paused') return pausedSeconds;

  if (!session.last_resumed_at) return pausedSeconds;

  const resumedAt = new Date(session.last_resumed_at).getTime();
  const deltaSeconds = Math.max(0, Math.floor((now.getTime() - resumedAt) / 1000));
  return pausedSeconds + deltaSeconds;
}

export function getRemainingSeconds(session: PomodoroSessionRow, now = new Date()) {
  return Math.max(0, session.planned_duration_sec - elapsedSeconds(session, now));
}

export async function getActiveSession() {
  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .in('status', [...ACTIVE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const data = (raw ?? null) as PomodoroSessionRow | null;
  return data;
}

export async function createSession(title: string) {
  const cleanedTitle = title.trim() || 'Focus Session';

  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      title: cleanedTitle,
      planned_duration_sec: DEFAULT_FOCUS_SECONDS,
      status: 'created',
      paused_total_sec: 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  const data = raw as PomodoroSessionRow;
  return data;
}

export async function startSession(session: PomodoroSessionRow) {
  const now = nowIso();

  const payload =
    session.status === 'created'
      ? {
          status: 'running' as const,
          started_at: now,
          last_resumed_at: now,
        }
      : {
          status: 'running' as const,
          last_resumed_at: now,
        };

  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .update(payload)
    .eq('id', session.id)
    .select('*')
    .single();

  if (error) throw error;
  const data = raw as PomodoroSessionRow;
  return data;
}

export async function pauseSession(session: PomodoroSessionRow) {
  if (session.status !== 'running' || !session.last_resumed_at) return session;

  const resumedAtMs = new Date(session.last_resumed_at).getTime();
  const nowMs = Date.now();
  const deltaSeconds = Math.max(0, Math.floor((nowMs - resumedAtMs) / 1000));

  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .update({
      status: 'paused',
      paused_total_sec: session.paused_total_sec + deltaSeconds,
      last_resumed_at: null,
    })
    .eq('id', session.id)
    .select('*')
    .single();

  if (error) throw error;
  const data = raw as PomodoroSessionRow;
  return data;
}

export async function completeSession(session: PomodoroSessionRow) {
  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .update({
      status: 'completed',
      completed_at: nowIso(),
      last_resumed_at: null,
    })
    .eq('id', session.id)
    .select('*')
    .single();

  if (error) throw error;
  const data = raw as PomodoroSessionRow;
  return data;
}

export async function cancelSession(session: PomodoroSessionRow) {
  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .update({
      status: 'canceled',
      last_resumed_at: null,
    })
    .eq('id', session.id)
    .select('*')
    .single();

  if (error) throw error;
  const data = raw as PomodoroSessionRow;
  return data;
}

export async function getStats(range: StatsRange, anchor = new Date()) {
  const { start, end } = getRangeBoundaries(range, anchor);
  const buckets = initializeBuckets(range, anchor);

  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .select('completed_at')
    .eq('status', 'completed')
    .gte('completed_at', start.toISOString())
    .lte('completed_at', end.toISOString())
    .not('completed_at', 'is', null);

  if (error) throw error;
  const data = (raw ?? []) as { completed_at: string | null }[];

  for (const item of data) {
    if (item.completed_at) {
      addToBucket(buckets, range, item.completed_at);
    }
  }

  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  return { buckets, total };
}
