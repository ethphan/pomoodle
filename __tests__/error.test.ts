import { toUserMessage } from '@/lib/error';

describe('toUserMessage', () => {
  it('maps network failures to a friendly Supabase message', () => {
    const message = toUserMessage(new Error('Network request failed'));

    expect(message).toContain('Cannot reach Supabase.');
  });

  it('returns generic Error messages as-is', () => {
    expect(toUserMessage(new Error('Bad credentials'))).toBe('Bad credentials');
  });

  it('handles non-Error objects with a message field', () => {
    expect(toUserMessage({ message: 'Custom object error' })).toBe('Custom object error');
  });

  it('falls back for unknown inputs', () => {
    expect(toUserMessage(null)).toBe('Something went wrong. Please try again.');
  });
});
