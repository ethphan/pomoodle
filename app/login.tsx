import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const primaryTextColor = colorScheme === 'dark' ? Colors.dark.background : '#fff';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pomoodle</ThemedText>
      <ThemedText style={styles.subtitle}>Log in to start your first focus sprint.</ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText type="defaultSemiBold">Email</ThemedText>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.icon}
          style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText type="defaultSemiBold">Password</ThemedText>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={colors.icon}
          secureTextEntry
          style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        onPress={() => router.replace('/(tabs)')}
      >
        <ThemedText type="defaultSemiBold" style={[styles.primaryButtonText, { color: primaryTextColor }]}>
          Continue
        </ThemedText>
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Continue with Google</ThemedText>
      </Pressable>

      <ThemedText style={styles.footer}>
        By continuing you agree to the Pomoodle Terms.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 16,
  },
  subtitle: {
    opacity: 0.7,
  },
  fieldGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    opacity: 0.2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footer: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.6,
  },
});
