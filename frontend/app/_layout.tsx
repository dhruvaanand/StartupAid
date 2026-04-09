import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useFonts({
    Fredoka: 'https://fonts.gstatic.com/s/fredoka/v15/k3kXo84MPGSjPEskf6_aL_513_3_4224.woff2',
    Nunito700: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofINeaBTMn8.woff2',
    Nunito800: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofI65aBTMn8.woff2',
    Nunito900: 'https://fonts.gstatic.com/s/nunito/v26/XRXV3I6Li01BKofI75aBTMn8.woff2',
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
