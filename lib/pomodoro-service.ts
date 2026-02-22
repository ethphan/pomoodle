import type { PomodoroSessionRow } from '@/types/database';

import { supabase } from '@/lib/supabase';

export const DEFAULT_FOCUS_SECONDS = 25 * 60;

export type StatsRange = 'day' | 'week' | 'month' | 'year';
export type StatsBar = {
  label: string;
  value: number;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
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

function getDaysInMonth(year: number, month1Based: number) {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  });
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} from date parts`);
    return Number.parseInt(value, 10);
  };

  let hour = read('hour');
  // Some locales/engines may format midnight as 24.
  if (hour === 24) hour = 0;

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
  };
}

function dayKey(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function monthKey(parts: Pick<ZonedParts, 'year' | 'month'>) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
}

function getMondayWeekStartKey(parts: Pick<ZonedParts, 'year' | 'month' | 'day'>) {
  const utcMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
  const day = new Date(utcMidnight).getUTCDay(); // 0=Sun..6=Sat
  const mondayIndex = day === 0 ? 6 : day - 1;
  const mondayUtc = utcMidnight - mondayIndex * 24 * 60 * 60 * 1000;
  const mondayDate = new Date(mondayUtc);
  return dayKey({
    year: mondayDate.getUTCFullYear(),
    month: mondayDate.getUTCMonth() + 1,
    day: mondayDate.getUTCDate(),
  });
}

function getCoarseQueryRange(range: StatsRange, anchor = new Date()) {
  const { start, end } = getRangeBoundaries(range, anchor);
  const paddedStart = new Date(start);
  const paddedEnd = new Date(end);

  // Pad query window so timezone offsets / DST do not exclude valid sessions.
  paddedStart.setDate(paddedStart.getDate() - 2);
  paddedEnd.setDate(paddedEnd.getDate() + 2);

  return { start: paddedStart, end: paddedEnd };
}

function initializeBuckets(range: StatsRange, anchor = new Date(), timeZone?: string) {
  const anchorParts = timeZone ? getZonedParts(anchor, timeZone) : null;

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
    const daysInMonth = anchorParts
      ? getDaysInMonth(anchorParts.year, anchorParts.month)
      : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
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

function addToBucket(buckets: StatsBar[], range: StatsRange, parts: ZonedParts) {
  if (range === 'day') {
    buckets[parts.hour].value += 1;
    return;
  }

  if (range === 'week') {
    const utcMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
    const day = new Date(utcMidnight).getUTCDay();
    const index = day === 0 ? 6 : day - 1;
    buckets[index].value += 1;
    return;
  }

  if (range === 'month') {
    buckets[parts.day - 1].value += 1;
    return;
  }

  buckets[parts.month - 1].value += 1;
}

function isInRange(range: StatsRange, anchorParts: ZonedParts, itemParts: ZonedParts) {
  if (range === 'day') {
    return dayKey(anchorParts) === dayKey(itemParts);
  }

  if (range === 'week') {
    return getMondayWeekStartKey(anchorParts) === getMondayWeekStartKey(itemParts);
  }

  if (range === 'month') {
    return monthKey(anchorParts) === monthKey(itemParts);
  }

  return anchorParts.year === itemParts.year;
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in to create a pomodoro.');

  const { data: raw, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
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

export async function getStats(
  range: StatsRange,
  anchor = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
) {
  const { start, end } = getCoarseQueryRange(range, anchor);
  const buckets = initializeBuckets(range, anchor, timeZone);
  const anchorParts = getZonedParts(anchor, timeZone);

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
      const itemParts = getZonedParts(new Date(item.completed_at), timeZone);
      if (!isInRange(range, anchorParts, itemParts)) continue;
      addToBucket(buckets, range, itemParts);
    }
  }

  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  return { buckets, total };
}
