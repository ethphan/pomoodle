import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const primaryTextColor = colorScheme === 'dark' ? Colors.dark.background : '#fff';
  const { session, signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  const runAuth = async (
    fn: () => Promise<void | 'success' | 'cancelled'>,
    successMessage: string,
    cancelledMessage?: string
  ) => {
    try {
      setIsSubmitting(true);
      setMessage(null);
      const result = await fn();

      if (result === 'cancelled') {
        setMessage(cancelledMessage ?? 'Sign-in cancelled.');
        return;
      }

      setMessage(successMessage);
    } catch (error) {
      const fallback = 'Something went wrong. Please try again.';
      setMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pomoodle</ThemedText>
      <ThemedText style={styles.subtitle}>Focus faster with a simple 25 minute sprint.</ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText type="defaultSemiBold">Email</ThemedText>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.icon}
          style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
          value={email}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText type="defaultSemiBold">Password</ThemedText>
        <TextInput
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={colors.icon}
          secureTextEntry
          style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
          value={password}
        />
      </View>

      <Pressable
        disabled={isSubmitting}
        style={[styles.primaryButton, { backgroundColor: colors.tint }, isSubmitting ? styles.disabled : undefined]}
        onPress={() => runAuth(() => signInWithEmail(email.trim(), password), 'Signed in successfully.')}
      >
        <ThemedText type="defaultSemiBold" style={[styles.primaryButtonText, { color: primaryTextColor }]}>Sign In</ThemedText>
      </Pressable>

      <Pressable
        disabled={isSubmitting}
        style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }, isSubmitting ? styles.disabled : undefined]}
        onPress={() =>
          runAuth(
            () => signUpWithEmail(email.trim(), password),
            'Account created. Check your email if confirmation is required.'
          )
        }
      >
        <ThemedText type="defaultSemiBold">Create Account</ThemedText>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        disabled={isSubmitting}
        style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }, isSubmitting ? styles.disabled : undefined]}
        onPress={() => runAuth(() => signInWithGoogle(), 'Google sign-in complete.', 'Google sign-in cancelled.')}
      >
        <ThemedText type="defaultSemiBold">Continue with Google</ThemedText>
      </Pressable>

      {message ? <ThemedText style={styles.feedback}>{message}</ThemedText> : null}

      <ThemedText style={styles.footer}>By continuing you agree to the Pomoodle Terms.</ThemedText>
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
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    opacity: 0.2,
  },
  disabled: {
    opacity: 0.6,
  },
  feedback: {
    fontSize: 12,
    opacity: 0.8,
  },
  footer: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
});
