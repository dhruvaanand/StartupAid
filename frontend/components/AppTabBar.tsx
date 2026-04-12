import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { Terminal, Users, BarChart2, Settings, Compass } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { useTheme } from '@/context/theme-context';

type Tab = {
  route: string;
  name: string;
  matchPrefixes?: string[];
  icon: any;
};

const TABS: Tab[] = [
  { name: 'home',    route: '/(tabs)',         icon: Terminal },
  { name: 'circles', route: '/(tabs)/circles', icon: Users },
  { name: 'map',     route: '/(tabs)/map',     matchPrefixes: ['/priority'], icon: Compass },
  { name: 'explore', route: '/(tabs)/explore', icon: BarChart2 },
  { name: 'profile', route: '/(tabs)/profile', icon: Settings },
];

const HIDDEN_SEGMENTS = new Set(['focus', 'quiz']);

export function AppTabBar() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const colors = Palette[scheme];

  if (HIDDEN_SEGMENTS.has(segments[0] as string)) return null;

  // Improved active route detection
  const activeTab = (() => {
    // Check match prefixes first (e.g. /priority -> map)
    for (const tab of TABS) {
      if (tab.matchPrefixes?.some(p => pathname.startsWith(p))) return tab.name;
    }
    
    // Map segments to tab names
    const lastSegment = segments[segments.length - 1] as string;
    if (segments.length === 1 && segments[0] === '(tabs)') return 'home';
    if (lastSegment === 'index' || lastSegment === '(tabs)') return 'home';
    
    return lastSegment || 'home';
  })();

  return (
    <View style={[styles.bar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }, { shadowColor: colors.shadow }]}>
      {TABS.map(tab => {
        const focused = activeTab === tab.name;
        const color = focused ? colors.accent : colors.textSecondary;
        const Icon = tab.icon;

        return (
          <Pressable
            key={tab.route}
            style={styles.tabItem}
            onPress={() => router.navigate(tab.route as any)}
          >
            {focused ? (
              <View style={[styles.activePill, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                <Icon size={22} color={color} strokeWidth={2.5} />
              </View>
            ) : (
              <View style={styles.inactiveWrap}>
                <Icon size={22} color={color} strokeWidth={2} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0c1322',
    paddingTop: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
    ],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#141b2b',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.5)', inset: true },
    ],
  },
  inactiveWrap: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
