jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {},
  },
}));

import { getUrlParams } from '@/providers/auth-provider';

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
