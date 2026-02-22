import type { PomodoroSessionRow } from '@/types/database';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {},
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import { createSession, getRemainingSeconds, getStats } from '@/lib/pomodoro-service';

const mockSupabase = supabase as unknown as {
  auth: { getUser?: jest.Mock };
  from: jest.Mock;
};

function session(overrides: Partial<PomodoroSessionRow> = {}): PomodoroSessionRow {
  return {
    id: 'session-1',
    user_id: 'user-1',
    title: 'Focus Session',
    planned_duration_sec: 1500,
    status: 'created',
    started_at: null,
    last_resumed_at: null,
    paused_total_sec: 0,
    completed_at: null,
    created_at: new Date(2026, 0, 1, 10, 0, 0).toISOString(),
    ...overrides,
  };
}

function createBuilder(options: { singleData?: unknown; statsData?: unknown[] } = {}) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockResolvedValue({ data: options.statsData ?? [], error: null }),
    single: jest.fn().mockResolvedValue({ data: options.singleData ?? null, error: null }),
  };
}

describe('pomodoro-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser = jest.fn();
    mockSupabase.from.mockReset();
  });

  it('computes remaining seconds for running sessions', () => {
    const now = new Date(2026, 0, 1, 10, 0, 30);
    const running = session({
      status: 'running',
      paused_total_sec: 120,
      last_resumed_at: new Date(2026, 0, 1, 10, 0, 0).toISOString(),
    });

    expect(getRemainingSeconds(running, now)).toBe(1350);
  });

  it('throws if creating session without authenticated user', async () => {
    mockSupabase.auth.getUser?.mockResolvedValue({ data: { user: null }, error: null });

    await expect(createSession('Deep Work')).rejects.toThrow('You must be signed in to create a pomodoro.');
  });

  it('creates a session with trimmed title and user id', async () => {
    const created = session({ title: 'Deep Work' });
    const builder = createBuilder({ singleData: created });

    mockSupabase.auth.getUser?.mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await createSession('  Deep Work  ');

    expect(mockSupabase.from).toHaveBeenCalledWith('pomodoro_sessions');
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-abc',
        title: 'Deep Work',
      })
    );
    expect(result.title).toBe('Deep Work');
  });

  it('aggregates weekly stats into monday-sunday buckets', async () => {
    const monday = new Date(2026, 0, 5, 12, 0, 0).toISOString();
    const sunday = new Date(2026, 0, 11, 12, 0, 0).toISOString();
    const builder = createBuilder({ statsData: [{ completed_at: monday }, { completed_at: sunday }] });

    mockSupabase.from.mockReturnValue(builder);

    const result = await getStats('week', new Date(2026, 0, 7, 12, 0, 0));

    expect(result.total).toBe(2);
    expect(result.buckets[0]).toEqual({ label: 'Mon', value: 1 });
    expect(result.buckets[6]).toEqual({ label: 'Sun', value: 1 });
  });

  it('buckets day stats using provided timezone instead of UTC boundaries', async () => {
    // 2026-01-06 07:30Z is 2026-01-05 23:30 in America/Los_Angeles (PST)
    const nearMidnightUtc = '2026-01-06T07:30:00.000Z';
    const builder = createBuilder({ statsData: [{ completed_at: nearMidnightUtc }] });

    mockSupabase.from.mockReturnValue(builder);

    const result = await getStats('day', new Date('2026-01-05T20:00:00.000Z'), 'America/Los_Angeles');

    expect(result.total).toBe(1);
    expect(result.buckets[23]).toEqual({ label: '23', value: 1 });
  });
});
