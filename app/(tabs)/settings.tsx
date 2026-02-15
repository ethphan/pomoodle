import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Default focus length</ThemedText>
        <ThemedText>25 min</ThemedText>
      </View>
      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Default break length</ThemedText>
        <ThemedText>5 min</ThemedText>
      </View>
      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Sound</ThemedText>
        <ThemedText>On</ThemedText>
      </View>
      <View style={[styles.row, { borderColor: colors.tabIconDefault }]}>
        <ThemedText type="defaultSemiBold">Vibrate</ThemedText>
        <ThemedText>On</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 12,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
