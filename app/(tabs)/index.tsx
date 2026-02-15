import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const CYCLE_TARGET = 4;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;
const BREAK_SECONDS = BREAK_MINUTES * 60;

type SessionMode = 'focus' | 'break';

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
  const [mode, setMode] = useState<SessionMode>('focus');
  const [secondsRemaining, setSecondsRemaining] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [autoBreak, setAutoBreak] = useState(true);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);

  const cycleComplete =
    completedFocusSessions >= CYCLE_TARGET &&
    mode === 'focus' &&
    secondsRemaining === FOCUS_SECONDS &&
    !isRunning;

  const completePhase = useCallback(
    (continueRunning: boolean) => {
      if (mode === 'focus') {
        const nextCompleted = Math.min(completedFocusSessions + 1, CYCLE_TARGET);
        setCompletedFocusSessions(nextCompleted);

        if (nextCompleted >= CYCLE_TARGET) {
          setMode('focus');
          setSecondsRemaining(FOCUS_SECONDS);
          setIsRunning(false);
          return;
        }

        setMode('break');
        setSecondsRemaining(BREAK_SECONDS);
        setIsRunning(continueRunning && autoBreak);
        return;
      }

      setMode('focus');
      setSecondsRemaining(FOCUS_SECONDS);
      setIsRunning(continueRunning);
    },
    [autoBreak, completedFocusSessions, mode]
  );

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || secondsRemaining > 0) return;
    completePhase(true);
  }, [completePhase, isRunning, secondsRemaining]);

  const handleStartPause = () => {
    if (cycleComplete) {
      setCompletedFocusSessions(0);
      setMode('focus');
      setSecondsRemaining(FOCUS_SECONDS);
      setIsRunning(true);
      return;
    }

    setIsRunning((value) => !value);
  };

  const handleResetPhase = () => {
    setIsRunning(false);
    setSecondsRemaining(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const handleResetCycle = () => {
    setMode('focus');
    setSecondsRemaining(FOCUS_SECONDS);
    setCompletedFocusSessions(0);
    setIsRunning(false);
  };

  const handleSkip = () => completePhase(isRunning);

  const title = mode === 'focus' ? 'Focus Sprint' : 'Break';
  const startButtonLabel = useMemo(() => {
    if (cycleComplete) return 'Start New Cycle';
    return isRunning ? 'Pause' : 'Start';
  }, [cycleComplete, isRunning]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{title}</ThemedText>
      <ThemedText style={styles.subtitle}>{formatTime(secondsRemaining)}</ThemedText>

      <View style={styles.cardRow}>
        <Pressable
          disabled={isRunning}
          onPress={() => {
            setMode('focus');
            setSecondsRemaining(FOCUS_SECONDS);
          }}
          style={[
            styles.card,
            { borderColor: colors.tabIconDefault },
            mode === 'focus' ? { borderColor: colors.tint } : undefined,
          ]}>
          <ThemedText type="defaultSemiBold">Focus</ThemedText>
          <ThemedText>{FOCUS_MINUTES} min</ThemedText>
        </Pressable>
        <Pressable
          disabled={isRunning}
          onPress={() => {
            setMode('break');
            setSecondsRemaining(BREAK_SECONDS);
          }}
          style={[
            styles.card,
            { borderColor: colors.tabIconDefault },
            mode === 'break' ? { borderColor: colors.tint } : undefined,
          ]}>
          <ThemedText type="defaultSemiBold">Break</ThemedText>
          <ThemedText>{BREAK_MINUTES} min</ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={handleStartPause} style={[styles.primaryButton, { backgroundColor: colors.tint }]}>
        <ThemedText type="defaultSemiBold" style={[styles.primaryButtonText, { color: primaryTextColor }]}>
          {startButtonLabel}
        </ThemedText>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]} onPress={handleResetPhase}>
          <ThemedText type="defaultSemiBold">Reset</ThemedText>
        </Pressable>
        <Pressable style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]} onPress={handleSkip}>
          <ThemedText type="defaultSemiBold">Skip</ThemedText>
        </Pressable>
      </View>

      <Pressable style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]} onPress={handleResetCycle}>
        <ThemedText type="defaultSemiBold">Reset cycle</ThemedText>
      </Pressable>

      <View style={styles.footerRow}>
        <ThemedText style={styles.footerText}>
          {cycleComplete ? 'Cycle complete' : `Session ${completedFocusSessions} of ${CYCLE_TARGET}`}
        </ThemedText>
        <Pressable onPress={() => setAutoBreak((value) => !value)}>
          <ThemedText style={styles.footerText}>Auto-break {autoBreak ? 'on' : 'off'}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 20,
  },
  subtitle: {
    fontSize: 64,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
