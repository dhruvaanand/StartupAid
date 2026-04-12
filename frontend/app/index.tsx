import { Text, View, useColorScheme } from 'react-native';
import { Palette } from '@/constants/theme';

export default function Page() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textSecondary }}>Establishing secure station link...</Text>
    </View>
  );
}
