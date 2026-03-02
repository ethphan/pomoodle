export function toUserMessage(error: unknown) {
  const fallback = 'Something went wrong. Please try again.';

  if (error instanceof Error) {
    if (error.message.includes('Network request failed')) {
      return 'Cannot reach Supabase. Check your internet and EXPO_PUBLIC_SUPABASE_URL, then restart Expo with `npx expo start -c`.';
    }
    return error.message || fallback;
  }

  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('Network request failed')) {
      return 'Cannot reach Supabase. Check your internet and EXPO_PUBLIC_SUPABASE_URL, then restart Expo with `npx expo start -c`.';
    }
    return error.message || fallback;
  }

  return fallback;
}
