import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { getStats, type StatsBar, type StatsRange } from '@/lib/pomodoro-service';
import { useColorScheme } from '@/hooks/use-color-scheme';

const RANGES: StatsRange[] = ['day', 'week', 'month', 'year'];

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [range, setRange] = useState<StatsRange>('week');
  const [buckets, setBuckets] = useState<StatsBar[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      const result = await getStats(range);
      setBuckets(result.buckets);
      setTotal(result.total);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load stats.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pomodoro Stats</ThemedText>

      <View style={styles.filterRow}>
        {RANGES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setRange(item)}
            style={[
              styles.filterButton,
              { borderColor: colors.tabIconDefault },
              range === item ? { backgroundColor: colors.tint, borderColor: colors.tint } : undefined,
            ]}
          >
            <ThemedText style={range === item ? styles.filterActiveText : undefined}>{item}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.summaryCard, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Completed in this {range}</ThemedText>
        <ThemedText style={styles.metric}>{total}</ThemedText>
      </View>

      {isLoading ? <ThemedText>Loading stats...</ThemedText> : <BarChart data={buckets} />}
      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterActiveText: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  metric: {
    fontSize: 32,
    fontWeight: '700',
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
  },
});
