import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Reanimated from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Clock, TrendingUp, Play, Sparkles } from 'lucide-react-native';

import { Fonts, Palette } from '@/constants/theme';
import { useHomeSupabase } from '@/hooks/use-home-supabase';
import { useHomeAnimations } from '@/hooks/use-home-animations';
import { useAuth } from '@/lib/auth-context';
import NudgeToast from '@/components/NudgeToast';
import { useTheme } from '@/context/theme-context';
import { useRouter } from 'expo-router';

import { API_URL } from '@/constants/api';

// SVG progress ring constants
const RING_SIZE = 128;
const RING_RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function HomeScreen() {
  const router = useRouter();
  const {
    streakTarget,
    dailyPercent,
    circleMembers,
    todaysTopic,
    profileName,
    loading,
    error,
    refresh,
    xp,
  } = useHomeSupabase();

  const { scheme } = useTheme();
  const colors = Palette[scheme];

  const ctaScale = useState(new Animated.Value(1))[0];
  const [isPressed, setIsPressed] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; studying: string } | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; sender: string; type: any }>({
    visible: false, sender: '', type: 'wave',
  });

  const { user } = useAuth();
  const members = useMemo(() => circleMembers, [circleMembers]);

  const {
    secStyle0, secStyle1, secStyle2, secStyle3,
    mascotStyle, pulseStyle,
  } = useHomeAnimations(dailyPercent);

  const animateCTA = (pressed: boolean) => {
    setIsPressed(pressed);
    Animated.spring(ctaScale, {
      toValue: pressed ? 0.97 : 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  const handleNudge = async (targetId: string, sessionId?: string | null) => {
    if (!user || !sessionId) return;
    try {
      await fetch(`${API_URL}/social/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: targetId,
          type: 'wave',
          session_id: sessionId,
        }),
      });
    } catch {
      // fire-and-forget
    }
  };

  const mascotSource = useMemo(() => {
    if (selectedMember?.studying?.toLowerCase().includes('switched')) return require('@/brand_assets/angry_bear.png');
    if (dailyPercent >= 80) return require('@/brand_assets/happy_bear.png');
    if (dailyPercent <= 30) return require('@/brand_assets/sad_bear.png');
    return require('@/brand_assets/waving_bear.png');
  }, [dailyPercent, selectedMember]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const userInitial = profileName ? profileName.charAt(0).toUpperCase() : 'U';
  const level = Math.max(1, Math.floor((xp ?? 0) / 150));
  const activeCount = members.filter(m => m.status === 'online').length;

  // SVG ring calculation
  const clampedPercent = Math.min(100, Math.max(0, dailyPercent));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedPercent / 100);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn't load home</Text>
          <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={() => void refresh()}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── TOP BAR ── */}
        <Reanimated.View style={[styles.topBar, { backgroundColor: colors.surface }, secStyle0]}>
          <View style={styles.topBarLeft}>
            <View style={[styles.topAvatarOuter, { shadowColor: colors.shadow }]}>
              <View style={[styles.topAvatarInner, { shadowColor: colors.shadowDark }]}>
                <View style={[styles.topAvatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.accent }]}>
                  <Text style={[styles.topAvatarText, { color: colors.accent }]}>{userInitial}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.appTitle, { color: colors.accent }]}>Gommies</Text>
          </View>
          <Reanimated.View style={pulseStyle}>
            <Sparkles size={20} color={colors.accent} strokeWidth={2.5} />
          </Reanimated.View>
        </Reanimated.View>

        {/* ── GREETING ── */}
        <Reanimated.View style={[styles.greeting, secStyle2]}>
          <Text style={[styles.greetingTime, { color: colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>{profileName}</Text>
        </Reanimated.View>

        {/* ── HERO ROW: ring (flex 7) + mascot (flex 5) ── */}
        <Reanimated.View style={[styles.heroRow, secStyle1]}>
          {/* Progress Ring Card — col-span-7 */}
          <View style={[styles.ringCard, { backgroundColor: colors.surface }, styles.neumorphicFlat, { shadowColor: colors.shadow }]}>
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
                {/* Track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.surfaceSecondary}
                  strokeWidth={10}
                  fill="transparent"
                />
                {/* Progress arc — rotated -90deg via transform on parent */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.accent}
                  strokeWidth={10}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.ringPercent, { color: colors.text }]}>{dailyPercent}%</Text>
                <Text style={[styles.ringComplete, { color: colors.accent }]}>COMPLETE</Text>
              </View>
            </View>
            <Text style={[styles.ringLabel, { color: colors.textSecondary }]}>DAILY GOAL</Text>
          </View>

          {/* Floating Mascot — col-span-5 */}
          <Reanimated.View style={[styles.mascotWrap, mascotStyle]}>
            <View style={[styles.mascotGlow, { backgroundColor: colors.accentSecondary }]} />
            <Image source={mascotSource} style={styles.mascotImage} contentFit="contain" />
          </Reanimated.View>
        </Reanimated.View>

        {/* ── YOUR CIRCLE ── */}
        <Reanimated.View style={[styles.circleSection, secStyle3]}>
          <View style={styles.circleLabelRow}>
            <Text style={[styles.circleLabel, { color: colors.textSecondary }]}>YOUR CIRCLE</Text>
            {activeCount > 0 && (
              <Text style={[styles.activeCountText, { color: colors.accent }]}>{activeCount} Active</Text>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberScroll}
          >
            {members.map((m, idx) => {
              const online = m.status === 'online';
              const selected = selectedMember?.name === m.name;
              return (
                <Pressable
                  key={`${m.name}-${idx}`}
                  style={styles.memberItem}
                  onPress={() => setSelectedMember(selected ? null : { name: m.name, studying: m.studying })}
                >
                  {/* Avatar with surface-container-high padding ring — matches Stitch */}
                  <View style={[styles.memberAvatarRing, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={[styles.memberAvatar, { backgroundColor: colors.surface }, selected && { borderColor: colors.accent, borderWidth: 2 }]}>
                      <Text style={[styles.memberInitial, { color: colors.text }]}>{m.name[0]}</Text>
                    </View>
                    {/* Online dot */}
                    <Reanimated.View
                      style={[
                        styles.memberDot,
                        { backgroundColor: online ? colors.success : colors.textSecondary, borderColor: colors.background },
                        online && pulseStyle,
                      ]}
                    />
                  </View>
                  {online && (
                    <Pressable
                      style={[styles.waveBtn, { backgroundColor: colors.surfaceSecondary }]}
                      onPress={() => handleNudge(m.id, m.session_id)}
                      accessibilityLabel={`Wave at ${m.name}`}
                    >
                      <Text style={[styles.waveBtnText, { color: colors.accent }]}>WAVE</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedMember && (
            <View style={[styles.tooltip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
                <Text style={[styles.tooltipName, { color: colors.success }]}>{selectedMember.name}</Text>
                {'is studying'} {selectedMember.studying}
              </Text>
            </View>
          )}
        </Reanimated.View>

        {/* ── SESSION CARD ── */}
        <Reanimated.View style={[styles.sessionSection, secStyle2]}>
          <View style={[styles.sessionCard, { backgroundColor: colors.surface }, styles.neumorphicFlat, { shadowColor: colors.shadow }]}>
            {/* Background decoration */}
            <View style={[styles.sessionCardDeco, { backgroundColor: colors.accentSecondary }]} />
            <View style={styles.sessionTag}>
              <View style={[styles.sessionTagDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.sessionTagText, { color: colors.textSecondary }]}>SUGGESTED SESSION</Text>
            </View>
            <Text style={[styles.sessionTitle, { color: colors.text }]}>{todaysTopic}</Text>
            <View style={styles.sessionMeta}>
              <View style={styles.sessionMetaItem}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>45 mins</Text>
              </View>
              <View style={styles.sessionMetaItem}>
                <TrendingUp size={16} color={colors.success} />
                <Text style={[styles.sessionMetaText, { color: colors.success }]}>+250 XP</Text>
              </View>
            </View>
            <Pressable
              onPressIn={() => animateCTA(true)}
              onPressOut={() => animateCTA(false)}
              onPress={() => router.push('/priority/index')}
            >
              <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                <LinearGradient
                  colors={scheme === 'dark' ? ['#6bd8cb', '#29a195'] : ['#0d9488', '#0f766e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sessionCTA}
                >
                  <Text style={[styles.sessionCTAText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>Begin focus session</Text>
                  <Play size={14} color={scheme === 'light' ? '#fff' : '#00201d'} />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>
        </Reanimated.View>

        {/* ── STREAK + LEVEL ── */}
        <Reanimated.View style={[styles.statRow, secStyle3]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>STREAK</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{streakTarget} Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>LEVEL</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>LVL {level}</Text>
          </View>
        </Reanimated.View>

      </ScrollView>

      <NudgeToast
        visible={toast.visible}
        senderName={toast.sender}
        type={toast.type}
        onFinished={() => setToast(t => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  scroll: { paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: '#64748B', fontSize: 15, fontFamily: Fonts?.body ?? 'system' },
  errorTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: Fonts?.primary ?? 'system' },
  errorBody: { color: '#94A3B8', fontSize: 14, fontFamily: Fonts?.body ?? 'system', textAlign: 'center' },
  retryBtn: { backgroundColor: '#6bd8cb', borderRadius: 99, paddingVertical: 12, paddingHorizontal: 24 },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: Fonts?.secondary ?? 'system' },

  // Neumorphic shadow helper
  neumorphicFlat: {
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
    ],
  },

  // Top bar
  topBar: {
    marginTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141b2b',
    paddingVertical: 16,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topAvatarOuter: {
    boxShadow: [{ offsetX: -3, offsetY: -3, blurRadius: 6, color: 'rgba(27,37,55,0.4)' }],
    borderRadius: 99,
  },
  topAvatarInner: {
    boxShadow: [{ offsetX: 3, offsetY: 3, blurRadius: 6, color: '#080c14' }],
    borderRadius: 99,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6bd8cb',
  },
  topAvatarText: { color: '#6bd8cb', fontSize: 16, fontFamily: Fonts?.primary ?? 'system' },
  appTitle: { color: '#6bd8cb', fontSize: 20, fontFamily: Fonts?.primary ?? 'system', letterSpacing: -0.5 },

  // Greeting
  greeting: { marginTop: 32, paddingHorizontal: 24 },
  greetingTime: { color: '#bcc9c6', fontSize: 22, fontFamily: Fonts?.body ?? 'system', fontWeight: '300' },
  greetingName: {
    color: '#ffffff',
    fontSize: 48,
    lineHeight: 56,
    fontFamily: Fonts?.primary ?? 'system',
    marginTop: 2,
  },

  // Hero row — 7:5 ratio via flex
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    gap: 24,
  },

  // Ring card — flex 7
  ringCard: {
    flex: 7,
    backgroundColor: '#141b2b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRing: { position: 'absolute' },
  ringCenter: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    color: '#dce2f7',
    fontSize: 24,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
  },
  ringComplete: {
    color: '#6bd8cb',
    fontSize: 9,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  ringLabel: {
    marginTop: 16,
    color: '#bcc9c6',
    fontSize: 11,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },

  // Mascot — flex 5
  mascotWrap: {
    flex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotGlow: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(107,216,203,0.2)',
    borderRadius: 9999,
    // blur would need expo-blur or react-native-blur — approximate with opacity
    opacity: 0.6,
  },
  mascotImage: { width: '100%', aspectRatio: 1 },

  // Circle members
  circleSection: { marginTop: 40 },
  circleLabelRow: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  circleLabel: {
    color: '#3d4947',
    fontSize: 11,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  activeCountText: { color: '#6bd8cb', fontSize: 10, fontFamily: Fonts?.label ?? 'system' },
  memberScroll: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 8,
  },
  memberItem: { alignItems: 'center', gap: 10 },
  // surface-container-high (#232a3a) padding ring — matches Stitch avatar pattern
  memberAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#232a3a',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#191f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { color: '#dce2f7', fontSize: 22, fontFamily: Fonts?.primary ?? 'system' },
  memberDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#0c1322',
  },
  waveBtn: {
    backgroundColor: '#2e3545',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBtnText: {
    color: '#6bd8cb',
    fontSize: 10,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 1,
    fontWeight: 'bold',
  },

  // Tooltip
  tooltip: {
    marginTop: 16, marginHorizontal: 24,
    backgroundColor: '#070e1d',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#3d4947',
  },
  tooltipText: { color: '#bcc9c6', fontSize: 14, fontFamily: Fonts?.body ?? 'system' },
  tooltipName: { color: '#4edea3', fontFamily: Fonts?.bodyBold ?? 'system' },

  // Session card
  sessionSection: { marginTop: 40, paddingHorizontal: 24 },
  sessionCard: {
    backgroundColor: '#141b2b',
    borderRadius: 16,
    padding: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  sessionCardDeco: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(107,216,203,0.05)',
    borderRadius: 64,
  },
  sessionTag: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sessionTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6bd8cb',
  },
  sessionTagText: {
    color: '#bcc9c6',
    fontSize: 10,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sessionTitle: {
    color: '#dce2f7',
    fontSize: 28,
    fontFamily: Fonts?.primary ?? 'system',
    lineHeight: 34,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  sessionMeta: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  sessionMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionMetaText: { color: '#bcc9c6', fontSize: 13, fontFamily: Fonts?.label ?? 'system' },
  sessionCTA: {
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sessionCTAText: {
    color: '#00201d',
    fontSize: 16,
    fontFamily: Fonts?.secondary ?? 'system',
    fontWeight: 'bold',
  },
  statRow: {
    marginTop: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#070e1d',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.15)',
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 10, color: 'rgba(27,37,55,0.4)' },
      { offsetX: 4, offsetY: 4, blurRadius: 10, color: '#080c14' },
    ],
  },
  statLabel: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#dce2f7',
    fontSize: 24,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
