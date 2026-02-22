import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetStats = jest.fn();

jest.mock('@/lib/pomodoro-service', () => ({
  getStats: (...args: unknown[]) => mockGetStats(...args),
}));

import StatsScreen from '@/app/(tabs)/stats';

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStats.mockImplementation(async (range: string) => {
      if (range === 'month') {
        return { buckets: [{ label: '1', value: 2 }], total: 2 };
      }

      return { buckets: [{ label: 'Mon', value: 1 }], total: 1 };
    });
  });

  it('loads weekly stats by default', async () => {
    const screen = render(<StatsScreen />);

    await waitFor(() => {
      expect(mockGetStats).toHaveBeenCalledWith('week', expect.any(Date), expect.any(String));
      expect(screen.getByText('Completed in this week')).toBeTruthy();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  it('reloads stats when selecting a different range', async () => {
    const screen = render(<StatsScreen />);

    await screen.findByText('week');
    fireEvent.press(screen.getByText('month'));

    await waitFor(() => {
      expect(mockGetStats).toHaveBeenCalledWith('month', expect.any(Date), expect.any(String));
      expect(screen.getByText('Completed in this month')).toBeTruthy();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });
});
