import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import {
  DEFAULT_FOCUS_SECONDS,
  cancelSession,
  completeSession,
  createSession,
  getActiveSession,
  getRemainingSeconds,
  pauseSession,
  startSession,
} from '@/lib/pomodoro-service';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PomodoroSessionRow } from '@/types/database';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Something went wrong.';
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const primaryTextColor = colorScheme === 'dark' ? Colors.dark.background : '#fff';

  const [session, setSession] = useState<PomodoroSessionRow | null>(null);
  const [titleInput, setTitleInput] = useState('Focus Session');
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_FOCUS_SECONDS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const active = await getActiveSession();
        if (!isMounted) return;
        setSession(active);
        setSecondsRemaining(active ? getRemainingSeconds(active) : DEFAULT_FOCUS_SECONDS);
      } catch (error) {
        if (!isMounted) return;
        setMessage(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session || session.status !== 'running') return;

    const timer = setInterval(() => {
      const remaining = getRemainingSeconds(session, new Date());
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'running' || secondsRemaining > 0) return;

    const finalize = async () => {
      try {
        await completeSession(session);
        setSession(null);
        setSecondsRemaining(DEFAULT_FOCUS_SECONDS);
        setMessage('Pomodoro completed. Nice work.');
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    };

    finalize();
  }, [secondsRemaining, session]);

  const statusLabel = useMemo(() => {
    if (!session) return 'No active pomodoro';
    if (session.status === 'created') return 'Created';
    if (session.status === 'paused') return 'Paused';
    return 'Running';
  }, [session]);

  const runAction = async (fn: () => Promise<void>) => {
    try {
      setIsSaving(true);
      setMessage(null);
      await fn();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = () =>
    runAction(async () => {
      const created = await createSession(titleInput);
      setSession(created);
      setSecondsRemaining(DEFAULT_FOCUS_SECONDS);
      setMessage('Pomodoro created.');
    });

  const handleStartPause = async () => {
    if (!session) {
      await runAction(async () => {
        const created = await createSession(titleInput);
        const running = await startSession(created);
        setSession(running);
        setSecondsRemaining(getRemainingSeconds(running));
        setMessage(null);
      });
      return;
    }

    if (session.status === 'running') {
      runAction(async () => {
        const paused = await pauseSession(session);
        setSession(paused);
        setSecondsRemaining(getRemainingSeconds(paused));
      });
      return;
    }

    runAction(async () => {
      const running = await startSession(session);
      setSession(running);
      setSecondsRemaining(getRemainingSeconds(running));
      setMessage(null);
    });
  };

  const handleCancel = () => {
    if (!session) return;

    runAction(async () => {
      await cancelSession(session);
      setSession(null);
      setSecondsRemaining(DEFAULT_FOCUS_SECONDS);
      setMessage('Pomodoro canceled.');
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading timer...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const startPauseLabel = session?.status === 'running' ? 'Pause' : 'Start';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pomodoro</ThemedText>
      <ThemedText style={styles.subtitle}>{formatTime(secondsRemaining)}</ThemedText>
      <ThemedText style={styles.status}>Status: {statusLabel}</ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText type="defaultSemiBold">Session title</ThemedText>
        <TextInput
          editable={!session || session.status === 'created'}
          onChangeText={setTitleInput}
          placeholder="What are you focusing on?"
          placeholderTextColor={colors.icon}
          style={[styles.input, { borderColor: colors.tabIconDefault, color: colors.text }]}
          value={titleInput}
        />
      </View>

      <View style={styles.row}>
        <Pressable
          disabled={isSaving || Boolean(session && session.status !== 'created')}
          onPress={handleCreate}
          style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }, (isSaving || Boolean(session && session.status !== 'created')) ? styles.disabled : undefined]}
        >
          <ThemedText type="defaultSemiBold">Create</ThemedText>
        </Pressable>

        <Pressable
          disabled={isSaving}
          onPress={handleStartPause}
          style={[styles.primaryButton, { backgroundColor: colors.tint }, isSaving ? styles.disabled : undefined]}
        >
          <ThemedText type="defaultSemiBold" style={[styles.primaryButtonText, { color: primaryTextColor }]}>{startPauseLabel}</ThemedText>
        </Pressable>
      </View>

      <Pressable
        disabled={!session || isSaving}
        onPress={handleCancel}
        style={[styles.secondaryButtonStandalone, { borderColor: colors.tabIconDefault }, (!session || isSaving) ? styles.disabled : undefined]}
      >
        <ThemedText type="defaultSemiBold">Cancel</ThemedText>
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
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 64,
    fontWeight: '600',
    lineHeight: 72,
  },
  status: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButtonStandalone: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
  },
});
