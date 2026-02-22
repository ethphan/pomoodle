import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockSignOut = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: { email: 'user@example.com' },
    signOut: mockSignOut,
    deleteAccount: mockDeleteAccount,
  }),
}));

import SettingsScreen from '@/app/(tabs)/settings';

describe('SettingsScreen account deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteAccount.mockResolvedValue(undefined);
  });

  it('requires confirmation before deleting account', async () => {
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Delete account'));

    expect(screen.getByText('Confirm delete account')).toBeTruthy();
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Confirm delete account'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    });
  });
});
