import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Reanimated from 'react-native-reanimated';
import { Flame, Users, Sparkles, Play, Target } from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { useHomeSupabase } from '@/hooks/use-home-supabase';
import { useHomeAnimations } from '@/hooks/use-home-animations';

export default function HomeScreen() {
  const { streakTarget, dailyPercent, circleMembers, todaysTopic, profileName, loading, error, refresh } =
    useHomeSupabase();

  const [selectedMember, setSelectedMember] = useState<{ name: string; studying: string } | null>(null);

  // Initialize all our animations from the custom hook
  const {
    secStyle0,
    secStyle1,
    secStyle2,
    secStyle3,
    mascotStyle,
    ctaStyle,
    pulseStyle,
    playIconStyle,
    rightArcStyle,
    leftArcStyle,
  } = useHomeAnimations(dailyPercent);

  const members = useMemo(() => circleMembers, [circleMembers]);

  const mascotSource = useMemo(() => {
    if (selectedMember?.studying?.toLowerCase().includes('switched')) {
      return require('@/brand_assets/angry_bear.png');
    }
    if (dailyPercent >= 80) return require('@/brand_assets/happy_bear.png');
    if (dailyPercent <= 30) return require('@/brand_assets/sad_bear.png');
    return require('@/brand_assets/waving_bear.png');
  }, [dailyPercent, selectedMember]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.stateText}>Loading your home…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Couldn&apos;t load home</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void refresh()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading home"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userInitial = profileName ? profileName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* TOP BAR */}
        <Reanimated.View style={[styles.topBar, secStyle0]}>
          <View style={styles.streakBadge} accessibilityLabel={`${streakTarget} day streak`}>
            <Flame size={15} color="#FB923C" />
            <Text style={styles.streakText}>{streakTarget}</Text>
          </View>
          <Pressable
            style={styles.avatarButton}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <Text style={styles.avatarInitials}>{userInitial}</Text>
          </Pressable>
        </Reanimated.View>

        {/* HERO WIDGET ROW: RING + MASCOT */}
        <Reanimated.View style={[styles.heroWidgetRow, secStyle1]}>
          <View style={styles.goalSectionContainer}>
            <View style={styles.ringWrap} accessibilityLabel="Daily Goal progress ring">
              <View style={styles.ringTrack} />
              <View style={[styles.clipper, { right: 0 }]}>
                <Reanimated.View style={[styles.arc, { right: 0 }, rightArcStyle]} />
              </View>
              <View style={[styles.clipper, { left: 0 }]}>
                <Reanimated.View style={[styles.arc, { left: 0 }, leftArcStyle]} />
              </View>
              <View style={styles.ringCenter}>
                <Text style={styles.ringPercent}>{dailyPercent}%</Text>
              </View>
            </View>
            <Text style={styles.goalLabel}>Daily Goal</Text>
          </View>

          <Reanimated.View style={[styles.heroMascotWrap, mascotStyle]}>
            <Image
              source={mascotSource}
              style={styles.heroMascotImage}
              contentFit="contain"
              accessibilityLabel="Friendly Bear Mascot"
            />
          </Reanimated.View>
        </Reanimated.View>

        {/* HERO GREETING */}
        <Reanimated.View style={[styles.heroGreetingSection, secStyle2]}>
          <Text style={styles.heroGreetingTime}>{getGreetingTime()},</Text>
          <Text style={styles.heroGreetingName}>{profileName} 👋</Text>
        </Reanimated.View>

        {/* START FOCUS CTA SECTION */}
        <Reanimated.View style={[styles.ctaSection, secStyle2]}>
          <View style={styles.topicRow}>
            <Target size={18} color="#0D9488" />
            <Text style={styles.topicText}>{todaysTopic}</Text>
          </View>

          <View style={styles.socialRow}>
            <Users size={16} color="#9CA3AF" />
            <Text style={styles.socialText}>
              {members.length} friends around right now
            </Text>
            <Reanimated.View style={pulseStyle}>
              <Sparkles size={14} color="#FBBF24" />
            </Reanimated.View>
          </View>

          {/* Overhauled CTA Button */}
          <Reanimated.View style={ctaStyle}>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel="Begin Focus Session"
            >
              <Reanimated.View style={playIconStyle}>
                <Play size={22} color="#FB923C" fill="#FB923C" />
              </Reanimated.View>
              <Text style={styles.ctaButtonText}>Begin Focus Session</Text>
            </Pressable>
          </Reanimated.View>
        </Reanimated.View>

        {/* CIRCLE FRIENDS SECTION */}
        <Reanimated.View style={[styles.circleSection, secStyle3]}>
          <Text style={styles.circleLabel}>YOUR CIRCLE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberRow}>
            {members.map((m, idx) => {
              const active = m.status === 'online';
              return (
                <Pressable
                  key={`${m.name}-${idx}`}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${m.name}'s status`}
                  onPress={() =>
                    setSelectedMember(
                      selectedMember?.name === m.name
                        ? null
                        : { name: m.name, studying: m.studying },
                    )
                  }
                  style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>{m.name[0]}</Text>
                    <Reanimated.View
                      style={[
                        styles.memberDot,
                        { backgroundColor: active ? '#10B981' : '#F59E0B' },
                        active && pulseStyle,
                      ]}
                    />
                  </View>
                  <Text style={styles.memberName}>{m.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedMember && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                <Text style={{ fontWeight: '900', color: '#0D9488' }}>{selectedMember.name}</Text> is studying {selectedMember.studying}
              </Text>
            </View>
          )}
        </Reanimated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  stateText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: Fonts.secondary,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  topBar: {
    marginTop: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    backgroundColor: '#0D948820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#5EEAD4',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Fonts.secondary,
  },
  heroWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 32,
    paddingHorizontal: 20,
  },
  goalSectionContainer: {
    alignItems: 'center',
  },
  ringWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#ffffff10',
    position: 'absolute',
  },
  clipper: {
    width: 60,
    height: 120,
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  arc: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderTopColor: '#0D9488',
    borderRightColor: '#0D9488',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    top: 0,
  },
  ringCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  goalLabel: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  heroMascotWrap: {
    width: 120,
    height: 120,
  },
  heroMascotImage: {
    width: '100%',
    height: '100%',
  },
  heroGreetingSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  heroGreetingTime: {
    color: '#94A3B8',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  heroGreetingName: {
    color: '#FFFFFF',
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    fontFamily: Fonts.primary,
    marginTop: 4,
  },
  ctaSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  topicRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicText: {
    color: '#5EEAD4',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  socialRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.secondary,
  },
  // Redesigned CTA - high contrast outline instead of heavy fill
  ctaButton: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderWidth: 2,
    borderColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ctaPressed: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
  },
  ctaButtonText: {
    color: '#FDBA74',
    fontSize: 19,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
    letterSpacing: 0.5,
  },
  circleSection: {
    marginTop: 40,
  },
  circleLabel: {
    paddingLeft: 20,
    color: '#9CA3AF',
    fontSize: 13,
    letterSpacing: 1.2,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  memberRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 18,
  },
  memberItem: {
    alignItems: 'center',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ffffff15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.secondary,
  },
  memberDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#111827',
  },
  memberName: {
    marginTop: 8,
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  tooltip: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0D948830',
    backgroundColor: '#0D948810',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tooltipText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.secondary,
  },
});
