import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { AuthProvider, getUrlParams, useAuth } from '@/providers/auth-provider';

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

describe('auth-provider URL parsing', () => {
  it('reads tokens from fragment callback URLs', () => {
    const params = getUrlParams(
      'pomoodle://login#access_token=token123&refresh_token=refresh456&expires_in=3600'
    );

    expect(params.get('access_token')).toBe('token123');
    expect(params.get('refresh_token')).toBe('refresh456');
  });

  it('reads auth code from query callback URLs', () => {
    const params = getUrlParams('pomoodle://login?code=abc123&type=signup');

    expect(params.get('code')).toBe('abc123');
    expect(params.get('type')).toBe('signup');
  });
});

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
