import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Users } from 'lucide-react-native';

import { Fonts, Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/context/theme-context';

import { API_URL } from '@/constants/api';

// Placeholder banner images — grayscale overlay applied via tintColor
const BANNER_COLORS = [
  '#232a3a',
  '#1a2232',
  '#191f2f',
  '#202838',
];

type CircleRow = {
  id: string;
  course: string;
  courseCode: string;
  activeCount: number;
};

export default function CirclesScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const { user } = useAuth();
  const { scheme } = useTheme();
  const colors = Palette[scheme];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circles, setCircles] = useState<CircleRow[]>([]);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const [scales] = useState<Record<string, Animated.Value>>({});

  const animatePress = (id: string, pressed: boolean) => {
    if (!scales[id]) scales[id] = new Animated.Value(1);
    Animated.spring(scales[id], {
      toValue: pressed ? 0.98 : 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?.id) return;
        const res = await fetch(`${API_URL}/circles/${user.id}`);
        if (!res.ok) throw new Error('Failed to load circles');
        const data = await res.json();
        const parsed: CircleRow[] = (Array.isArray(data) ? data : []).map((row: any) => ({
          id: row.id,
          course: row.name,
          courseCode: row.course_code,
          activeCount: row.active_count || 0,
        }));
        parsed.forEach(c => { scales[c.id] = new Animated.Value(1); });
        setCircles(parsed);
        const live = parsed.find(c => c.activeCount > 0);
        if (live) setLiveAlert(`${live.activeCount} member${live.activeCount > 1 ? 's' : ''} just started a session`);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load circles');
      } finally {
        setLoading(false);
      }
    };
    void fetchCircles();
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>

      {/* Top bar — matches Stitch header */}
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <View style={styles.topBarLeft}>
          <View style={[styles.topAvatar, { backgroundColor: colors.surfaceSecondary, shadowColor: colors.shadow }]}>
            <Text style={[styles.topAvatarText, { color: colors.accent }]}>{user?.email?.[0]?.toUpperCase() ?? 'G'}</Text>
          </View>
          <Text style={[styles.appTitle, { color: colors.accent }]}>Gommies</Text>
        </View>
        <Sparkles size={20} color={colors.accent} strokeWidth={2} />
      </View>

      {/* Glass NudgeToast — pill style with backdrop blur */}
      {liveAlert && (
        <View style={styles.nudgeToastWrap}>
          <View style={styles.nudgeToast}>
            <Animated.View style={[styles.nudgeDot, { opacity: pulse }]} />
            <Text style={styles.nudgeText}>{liveAlert.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Circles</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Active focus collectives within the terminal.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn't load circles</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      ) : circles.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No circles found yet.</Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Join a course circle to start studying with others.</Text>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const active = item.activeCount > 0;
            const scale = scales[item.id] ?? new Animated.Value(1);
            const bannerColor = BANNER_COLORS[index % BANNER_COLORS.length];
            return (
              <Pressable
                onPressIn={() => animatePress(item.id, true)}
                onPressOut={() => animatePress(item.id, false)}
                onPress={() => router.push(`/circle/${item.id}`)}
              >
                <Animated.View style={[styles.card, { transform: [{ scale }], backgroundColor: colors.surface, borderColor: colors.border }]}>

                  {/* Card header row: title + LIVE badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.course}</Text>
                      <View style={styles.memberRow}>
                        <Users size={14} color={colors.textSecondary} />
                        <Text style={[styles.memberCount, { color: colors.textSecondary }]}>{item.activeCount} Members</Text>
                      </View>
                    </View>
                    {active && (
                      <View style={[styles.liveBadge, { backgroundColor: colors.surfaceSecondary }]}>
                        <Animated.View style={[styles.liveDot, { opacity: pulse, backgroundColor: colors.success }]} />
                        <Text style={[styles.liveBadgeText, { color: colors.success }]}>LIVE</Text>
                      </View>
                    )}
                  </View>

                  {/* Banner image area — h=96, grayscale via backgroundColor layering */}
                  <View style={[styles.bannerArea, { backgroundColor: bannerColor }]}>
                    {/* Inner geometric pattern via absolute positioned views */}
                    <View style={styles.bannerPatternCircle} />
                    <View style={styles.bannerPatternLine} />
                    <Text style={styles.bannerCode}>{item.courseCode}</Text>
                  </View>

                  {/* Join Circle CTA — full-width rounded-full gradient */}
                  <View style={styles.joinBtnWrap}>
                    <LinearGradient
                      colors={scheme === 'dark' ? ['#6bd8cb', '#29a195'] : ['#0d9488', '#0f766e']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.joinBtn}
                    >
                      <Text style={[styles.joinBtnText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>Join Circle</Text>
                    </LinearGradient>
                  </View>

                </Animated.View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#0c1322',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232a3a',
    alignItems: 'center',
    justifyContent: 'center',
    // neumorphic-inset
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.5)', inset: true },
    ],
  },
  topAvatarText: { color: '#6bd8cb', fontSize: 16, fontFamily: Fonts?.primary ?? 'system' },
  appTitle: { color: '#6bd8cb', fontSize: 20, fontFamily: Fonts?.primary ?? 'system', letterSpacing: -0.5 },
  sparkle: { color: '#6bd8cb', fontSize: 22 },

  // NudgeToast — glass pill style
  nudgeToastWrap: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  nudgeToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(35,42,58,0.7)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.1)',
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 24, color: 'rgba(0,0,0,0.4)' }],
  },
  nudgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4edea3' },
  nudgeText: {
    color: '#dce2f7',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
  },

  // Header
  header: { paddingHorizontal: 24, marginBottom: 32 },
  title: { color: '#dce2f7', fontSize: 32, fontFamily: Fonts?.primary ?? 'system', fontWeight: 'bold', letterSpacing: -0.5 },
  subtitle: { color: '#bcc9c6', fontSize: 14, fontFamily: Fonts?.body ?? 'system', marginTop: 8 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTitle: { color: '#dce2f7', fontSize: 20, fontFamily: Fonts?.primary ?? 'system', textAlign: 'center' },
  errorBody: { color: '#bcc9c6', fontSize: 14, fontFamily: Fonts?.body ?? 'system', textAlign: 'center' },
  emptyText: { fontSize: 16, fontFamily: Fonts?.bodyMedium ?? 'system', textAlign: 'center' },
  emptyHint: { fontSize: 14, fontFamily: Fonts?.body ?? 'system', textAlign: 'center', maxWidth: 240, opacity: 0.6 },

  // Card — neumorphic-card style
  list: { gap: 32, paddingHorizontal: 24, paddingBottom: 120 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    gap: 24,
    padding: 24,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleGroup: { gap: 4 },
  cardTitle: {
    color: '#dce2f7',
    fontSize: 20,
    fontFamily: Fonts?.secondary ?? 'system',
    fontWeight: '600',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberIcon: { fontSize: 14, opacity: 0.6 },
  memberCount: {
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
  },

  // LIVE badge — surface-container-highest + secondary dot
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2e3545',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4edea3',
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 8, color: 'rgba(78,222,163,1)' }],
  },
  liveBadgeText: {
    color: '#4edea3',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },

  // Banner image area — h=96 with grayscale/abstract pattern
  bannerArea: {
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  bannerPatternCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(107,216,203,0.15)',
  },
  bannerPatternLine: {
    position: 'absolute',
    width: '120%',
    height: 1,
    backgroundColor: 'rgba(107,216,203,0.08)',
  },
  bannerCode: {
    color: 'rgba(107,216,203,0.2)',
    fontSize: 32,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 4,
    fontWeight: 'bold',
  },

  // Join Circle — full width rounded-full gradient
  joinBtnWrap: { borderRadius: 999 },
  joinBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#00201d',
    fontSize: 15,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
  },
});
