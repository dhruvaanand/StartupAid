import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Flame, Zap, Target, UserPlus } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Fonts, Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/context/theme-context';
import { API_URL } from '@/constants/api';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { scheme } = useTheme();
  const colors = Palette[scheme];

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const buttonScale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch(`${API_URL}/user/${id}/stats`);
        const data = await resp.json();
        setStats(data);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  const handleAddFriend = async () => {
    if (!user || requestStatus !== 'none') return;
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    try {
      const resp = await fetch(`${API_URL}/social/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, receiver_id: id }),
      });
      if (resp.ok) setRequestStatus('pending');
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const level = Math.max(1, Math.floor((stats?.xp_total ?? 0) / 150));
  const goalPct = stats?.daily_goal_target > 0
    ? Math.round((stats.daily_goal_current / stats.daily_goal_target) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={28} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>OPERATOR PROFILE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarOuter, { shadowColor: colors.shadow }]}>
            <View style={[styles.avatarInner, { shadowColor: colors.shadowDark }]}>
              <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: `${colors.accent}30` }]}>
                <Image
                  source={require('@/brand_assets/waving_bear.png')}
                  style={styles.avatarBear}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{stats?.name ?? 'Unknown'}</Text>
          <View style={[styles.levelBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.userLevel, { color: colors.accent }]}>LEVEL {level} OPERATOR</Text>
          </View>
        </View>

        {/* Bio Placeholder */}
        <View style={styles.bioContainer}>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            "Synthesizing focus waves across multiple domains. Architecture lead for course {stats?.last_course ?? 'GOMMIE'}."
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <StatBox icon={<Flame size={18} color={colors.error} fill={colors.error} />} value={stats?.streak ?? 0} label="Streak" />
          <StatBox icon={<Zap size={18} color={colors.accent} fill={colors.accent} />} value={stats?.xp_total ?? 0} label="Total XP" />
          <StatBox icon={<Target size={18} color={colors.success} />} value={`${goalPct}%`} label="Daily Goal" />
        </View>

        {/* Action Button */}
        {user?.id !== id && (
          <Pressable onPress={handleAddFriend} disabled={requestStatus !== 'none'} style={styles.actionBtnContainer}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <LinearGradient
                colors={requestStatus === 'none' ? (scheme === 'dark' ? ['#6bd8cb', '#29a195'] : ['#0d9488', '#0f766e']) : [colors.surface, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.actionBtn, { borderColor: colors.border }]}
              >
                {requestStatus === 'none' ? (
                  <>
                    <UserPlus size={18} color={scheme === 'light' ? '#fff' : '#00201d'} />
                    <Text style={[styles.actionBtnText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>ADD TO CIRCLE</Text>
                  </>
                ) : (
                  <Text style={[styles.actionBtnTextGhost, { color: colors.textSecondary }]}>REQUEST PENDING</Text>
                )}
              </LinearGradient>
            </Animated.View>
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: any; label: string }) {
  const { scheme } = useTheme();
  const colors = Palette[scheme];

  return (
    <View style={[styles.statBoxOuter, { shadowColor: colors.shadow }]}>
      <View style={[styles.statBoxInner, { shadowColor: colors.shadowDark }]}>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statIconWrap}>{icon}</View>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 64,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 12,
    fontFamily: Fonts?.label ?? 'system', letterSpacing: 2.5,
  },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 120, alignItems: 'center' },

  avatarSection: { alignItems: 'center', marginBottom: 24, gap: 10 },
  avatarOuter: { borderRadius: 999 },
  avatarInner: { borderRadius: 999 },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarBear: { width: 90, height: 90 },
  userName: { fontSize: 28, fontFamily: Fonts?.primary ?? 'system', marginTop: 12 },
  levelBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, borderWidth: 1, marginTop: 4,
  },
  userLevel: { fontSize: 10, fontFamily: Fonts?.label ?? 'system', letterSpacing: 1.5, fontWeight: '700' },

  bioContainer: { paddingHorizontal: 20, marginBottom: 40 },
  bioText: { textAlign: 'center', fontSize: 13, fontFamily: Fonts?.body ?? 'system', fontStyle: 'italic', lineHeight: 20 },

  statsRow: { flexDirection: 'row', width: '100%', gap: 14, marginBottom: 36 },
  statBoxOuter: { flex: 1, borderRadius: 20 },
  statBoxInner: { borderRadius: 20 },
  statBox: {
    borderRadius: 20, padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: { marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: Fonts?.primary ?? 'system' },
  statLabel: { fontSize: 9, fontFamily: Fonts?.label ?? 'system', letterSpacing: 1 },

  actionBtnContainer: { width: '100%', alignItems: 'center' },
  actionBtn: {
    width: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 99,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontFamily: Fonts?.secondary ?? 'system', letterSpacing: 1, fontWeight: '700' },
  actionBtnTextGhost: { fontSize: 13, fontFamily: Fonts?.secondary ?? 'system', letterSpacing: 1, fontWeight: '600' },
});
