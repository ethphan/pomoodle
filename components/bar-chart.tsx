import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type DataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: DataPoint[];
};

export function BarChart({ data }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {data.map((item) => {
          const height = Math.max(6, Math.round((item.value / maxValue) * 140));
          return (
            <View key={item.label} style={styles.item}>
              <ThemedText style={styles.value}>{item.value}</ThemedText>
              <View style={[styles.bar, { height, backgroundColor: colors.tint }]} />
              <ThemedText style={styles.label}>{item.label}</ThemedText>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    minHeight: 190,
    paddingVertical: 10,
  },
  item: {
    alignItems: 'center',
    width: 30,
    gap: 6,
  },
  bar: {
    width: 16,
    borderRadius: 6,
  },
  value: {
    fontSize: 11,
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    opacity: 0.7,
  },
});
