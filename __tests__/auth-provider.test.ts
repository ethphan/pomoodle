import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

type MockSupabase = {
  auth: {
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
};

function AuthProbe() {
  const { initErrorMessage, isLoading } = useAuth();
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, { testID: 'loading' }, String(isLoading)),
    React.createElement(Text, { testID: 'error' }, initErrorMessage ?? '')
  );
}

const mockSupabase = supabase as unknown as MockSupabase;

describe('AuthProvider startup failure handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  it('does not crash and exposes a user-friendly init error when session load fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Network request failed'),
    });

    const { getByTestId } = render(
      React.createElement(AuthProvider, null, React.createElement(AuthProbe, null))
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('false');
    });
    expect(getByTestId('error').props.children).toContain('Cannot reach Supabase');
  });
});
