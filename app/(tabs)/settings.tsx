import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setIsSubmitting(true);
      setMessage(null);
      await signOut();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to sign out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}> 
        <ThemedText type="defaultSemiBold">Signed in as</ThemedText>
        <ThemedText>{user?.email ?? 'Unknown'}</ThemedText>
      </View>

      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}> 
        <ThemedText type="defaultSemiBold">Default focus</ThemedText>
        <ThemedText>25 min</ThemedText>
      </View>

      <Pressable
        disabled={isSubmitting}
        onPress={handleSignOut}
        style={[styles.signOutButton, { borderColor: colors.tabIconDefault }, isSubmitting ? styles.disabled : undefined]}
      >
        <ThemedText type="defaultSemiBold">Sign out</ThemedText>
      </Pressable>

      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
  },
});
