import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { PomodoroSessionRow } from '@/types/database';

const mockGetActiveSession = jest.fn();
const mockCreateSession = jest.fn();
const mockStartSession = jest.fn();
const mockPauseSession = jest.fn();
const mockCancelSession = jest.fn();
const mockCompleteSession = jest.fn();
const mockScheduleNotification = jest.fn();
const mockCancelNotification = jest.fn();

jest.mock('@/lib/pomodoro-service', () => ({
  DEFAULT_FOCUS_SECONDS: 1500,
  getRemainingSeconds: jest.fn(() => 1490),
  getActiveSession: (...args: unknown[]) => mockGetActiveSession(...args),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  startSession: (...args: unknown[]) => mockStartSession(...args),
  pauseSession: (...args: unknown[]) => mockPauseSession(...args),
  cancelSession: (...args: unknown[]) => mockCancelSession(...args),
  completeSession: (...args: unknown[]) => mockCompleteSession(...args),
}));

jest.mock('@/lib/notifications', () => ({
  schedulePomodoroCompletionNotification: (...args: unknown[]) => mockScheduleNotification(...args),
  cancelScheduledNotification: (...args: unknown[]) => mockCancelNotification(...args),
}));

import TimerScreen from '@/app/(tabs)/index';

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

describe('TimerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveSession.mockResolvedValue(null);
    mockScheduleNotification.mockResolvedValue('notification-1');
    mockCancelNotification.mockResolvedValue(undefined);
  });

  it('starts immediately when pressing Start with no active session', async () => {
    const created = session({ status: 'created' });
    const running = session({ status: 'running', last_resumed_at: new Date().toISOString() });

    mockCreateSession.mockResolvedValue(created);
    mockStartSession.mockResolvedValue(running);

    const screen = render(<TimerScreen />);

    const startButton = await screen.findByText('Start');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith('Focus Session');
      expect(mockStartSession).toHaveBeenCalledWith(created);
    });
  });

  it('shows API error when start fails', async () => {
    mockCreateSession.mockRejectedValue(new Error('insert failed'));

    const screen = render(<TimerScreen />);

    const startButton = await screen.findByText('Start');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(screen.getByText('insert failed')).toBeTruthy();
    });
  });
});
