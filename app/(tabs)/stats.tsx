import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Your Stats</ThemedText>
      <ThemedText style={styles.subtitle}>This week</ThemedText>

      <View style={styles.grid}>
        <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
          <ThemedText type="defaultSemiBold">Total focus</ThemedText>
          <ThemedText style={styles.metric}>2h 40m</ThemedText>
        </View>
        <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
          <ThemedText type="defaultSemiBold">Sessions</ThemedText>
          <ThemedText style={styles.metric}>6</ThemedText>
        </View>
      </View>

      <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Streak</ThemedText>
        <ThemedText style={styles.metric}>2 days</ThemedText>
      </View>
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
  subtitle: {
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    flex: 1,
  },
  metric: {
    fontSize: 24,
    fontWeight: '600',
  },
});
