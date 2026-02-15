import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const primaryTextColor = colorScheme === 'dark' ? Colors.dark.background : '#fff';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Focus Sprint</ThemedText>
      <ThemedText style={styles.subtitle}>25:00</ThemedText>

      <View style={styles.cardRow}>
        <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
          <ThemedText type="defaultSemiBold">Focus</ThemedText>
          <ThemedText>25 min</ThemedText>
        </View>
        <View style={[styles.card, { borderColor: colors.tabIconDefault }]}>
          <ThemedText type="defaultSemiBold">Break</ThemedText>
          <ThemedText>5 min</ThemedText>
        </View>
      </View>

      <View style={[styles.primaryButton, { backgroundColor: colors.tint }]}>
        <ThemedText type="defaultSemiBold" style={[styles.primaryButtonText, { color: primaryTextColor }]}>
          Start
        </ThemedText>
      </View>

      <View style={styles.footerRow}>
        <ThemedText style={styles.footerText}>Session 0 of 4</ThemedText>
        <ThemedText style={styles.footerText}>Auto-break on</ThemedText>
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
