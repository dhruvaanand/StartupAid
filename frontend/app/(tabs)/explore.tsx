import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

import { API_URL } from '@/constants/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Rank badge labels — matching Stitch UI
const RANK_BADGES: Record<number, string> = {
  1: 'Master',
  2: 'Focus Lead',
  3: 'High Architect',
  4: 'Senior Terminal',
  5: 'Deep Operator',
};

export default function CompeteLeaderboard() {
  const [activeTab, setActiveTab] = useState<'global' | 'known'>('global');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  const tabAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/leaderboard?type=${activeTab}${user ? `&user_id=${user.id}` : ''}`;
      const resp = await fetch(url);
      const data = await resp.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: 'global' | 'known') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'global' ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const tabIndicatorTranslate = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48 - 16) / 2],
  });

  const myRank = leaderboard.findIndex(item => item.id === user?.id) + 1;
  const myData = leaderboard.find(item => item.id === user?.id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>SEASON 04: THE VOID SHIFT</Text>
      </View>

      {/* Tab selector — neumorphic-recessed active */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabs, { backgroundColor: colors.surface }, { shadowColor: colors.shadow }]}>
          <Animated.View
            style={[
              styles.tabIndicator,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              { shadowColor: colors.shadowDark },
              { transform: [{ translateX: tabIndicatorTranslate }] },
            ]}
          />
          <Pressable style={styles.tabButton} onPress={() => switchTab('global')}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'global' && { color: colors.accent }]}>
              Global
            </Text>
          </Pressable>
          <Pressable style={styles.tabButton} onPress={() => switchTab('known')}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'known' && { color: colors.accent }]}>
              Friends
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No rankings yet for this section.</Text>
          </View>
        ) : (
          <>
            {leaderboard.slice(0, 10).map((item, index) => (
              <LeaderboardRow
                key={item.id}
                user={item}
                rank={index + 1}
                isMe={item.id === user?.id}
                onPress={() => router.push(`/profile/${item.id}`)}
              />
            ))}

            {/* Your ranking section */}
            {myData && myRank > 10 && (
              <View style={styles.yourRankSection}>
                <Text style={[styles.yourRankLabel, { color: colors.textSecondary }]}>YOUR RANKING</Text>
                <LeaderboardRow
                  user={myData}
                  rank={myRank}
                  isMe
                  onPress={() => {}}
                />
              </View>
            )}

            {/* Season rewards CTA */}
            <LinearGradient
              colors={scheme === 'dark' ? ['#6bd8cb', '#29a195'] : ['#0d9488', '#0f766e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardsBtn}
            >
              <Text style={[styles.rewardsBtnText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>VIEW SEASON REWARDS</Text>
            </LinearGradient>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LeaderboardRow({ user, rank, isMe, onPress }: {
  user: any; rank: number; isMe: boolean; onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const isFirst = rank === 1;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const badge = RANK_BADGES[rank];

  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.row,
        { backgroundColor: colors.surface, borderLeftColor: 'transparent', shadowColor: colors.shadow },
        isFirst && { borderLeftWidth: 4, borderLeftColor: colors.success },
        isMe && !isFirst && { backgroundColor: colors.surfaceSecondary, borderLeftWidth: 2, borderLeftColor: colors.accent },
      ]}>
        {/* Rank number — JetBrains Mono */}
        <Text style={[
          styles.rank,
          { color: colors.textSecondary },
          isFirst && { color: colors.success },
          isMe && { color: colors.accent },
        ]}>
          {rank.toString().padStart(2, '0')}
        </Text>

        {/* Avatar circle */}
        <View style={[
          styles.rowAvatar,
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          isFirst && { borderColor: colors.success, borderWidth: 2 },
          isMe && { borderColor: `${colors.accent}40` },
        ]}>
          <Text style={[styles.rowAvatarText, { color: colors.text }]}>{initial}</Text>
        </View>

        {/* User info + badge */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }, isMe && { color: colors.accent }]}>
            {user.name}{isMe ? ' (you)' : ''}
          </Text>
          {badge ? (
            <View style={[styles.rankBadgeChip, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.rankBadgeText, { color: colors.success }]}>
                {badge.toUpperCase()}
              </Text>
            </View>
          ) : (
            <Text style={[styles.rankBadgePlain, { color: colors.textSecondary }]}>
              {isMe ? 'ADVANCING' : 'MEMBER'}
            </Text>
          )}
        </View>

        {/* XP value */}
        <View style={styles.xpBlock}>
          <Text style={[styles.xpValue, { color: colors.text }, isFirst && { color: colors.success }, isMe && { color: colors.accent }]}>
            {(user.xp_week ?? 0).toLocaleString()}
          </Text>
          <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  header: { paddingTop: 20, paddingHorizontal: 24, marginBottom: 32 },
  title: {
    color: '#dce2f7',
    fontSize: 32,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 3,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // Tab selector
  tabContainer: { paddingHorizontal: 24, marginBottom: 48 },
  tabs: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#141b2b',
    borderRadius: 999,
    padding: 8,
    position: 'relative',
    maxWidth: 200,
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 10, color: 'rgba(27,37,55,0.3)' },
      { offsetX: 4, offsetY: 4, blurRadius: 10, color: '#080c14' },
    ],
  },
  tabIndicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 8,
    width: '48%',
    backgroundColor: '#070e1d',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3d4947',
    // Neumorphic inset
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.5)', inset: true },
    ],
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: '#3d4947', fontSize: 13, fontFamily: Fonts?.mono ?? 'system' },
  tabTextActive: { color: '#6bd8cb' },

  scroll: { flex: 1, paddingBottom: 120 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120, gap: 24 },

  emptyState: { marginTop: 80, alignItems: 'center', gap: 16 },
  emptyText: { color: '#3d4947', fontSize: 14, fontFamily: Fonts?.body ?? 'system', textAlign: 'center' },

  // Row base — neumorphic-elevated
  row: {
    backgroundColor: '#141b2b',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
    ],
  },
  // Rank #1 — border-l-4 border-secondary + glow
  firstRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#4edea3',
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
      { offsetX: 0, offsetY: 0, blurRadius: 20, color: 'rgba(78,222,163,0.2)' },
    ],
  },
  // Current user row
  meRow: {
    backgroundColor: '#2e3545',
    borderLeftWidth: 2,
    borderLeftColor: '#6bd8cb',
  },

  // Rank number — JetBrains Mono
  rank: {
    color: '#bcc9c6',
    fontSize: 20,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
    width: 36,
    textAlign: 'center',
  },
  firstRank: { color: '#4edea3' },
  meRank: { color: '#6bd8cb' },

  // Avatar
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#232a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3d4947',
  },
  firstAvatar: {
    borderWidth: 2,
    borderColor: '#4edea3',
  },
  meAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(107,216,203,0.3)',
  },
  rowAvatarText: { color: '#dce2f7', fontSize: 18, fontFamily: Fonts?.primary ?? 'system' },

  // User info
  userInfo: { flex: 1, gap: 4 },
  userName: { color: '#dce2f7', fontSize: 16, fontFamily: Fonts?.secondary ?? 'system', fontWeight: '600', letterSpacing: -0.3 },
  firstUserName: { color: '#dce2f7' },
  meUserName: { color: '#6bd8cb' },

  // Rank badge chip
  rankBadgeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#2e3545',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankBadgeText: {
    color: '#4edea3',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  firstBadgeText: { color: '#4edea3' },
  rankBadgePlain: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // XP block
  xpBlock: { alignItems: 'flex-end' },
  xpValue: {
    color: '#dce2f7',
    fontSize: 15,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
  },
  firstXp: { color: '#4edea3' },
  meXp: { color: '#6bd8cb' },
  xpLabel: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Your ranking section
  yourRankSection: { gap: 8, marginTop: 8 },
  yourRankLabel: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // Season rewards CTA — gradient rounded-full
  rewardsBtn: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsBtnText: {
    color: '#00201d',
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
