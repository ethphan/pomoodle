import { Redirect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}
