import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable, StyleSheet, Text, View, TextInput,
  ScrollView, AppState, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronLeft, Zap, Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

import { API_URL } from '@/constants/api';
const PRESET_TIMES = [15, 25, 45, 60];
const FRIENDS_LIST = ['Tejas', 'Pudie', 'Atharva', 'Rohan'];

export default function FocusSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const circleId = id || 'test-circle';

  const defaultName =
    id?.toLowerCase() === 'cs1.201' ? 'Data Structures' :
    id?.toLowerCase() === 'os' ? 'OS & CPU Scheduling' :
    id?.toLowerCase() === 'db' ? 'Databases' :
    id?.toUpperCase() || 'Focus Session';

  const [phase, setPhase] = useState<'setup' | 'active'>('setup');
  const [title, setTitle] = useState(defaultName + ' Deep Dive');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set(['Tejas']));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const appState = useRef(AppState.currentState);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'active' && timeLeft === 0) {
      void handleEndSession();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [phase, isPaused, timeLeft]);

  useEffect(() => {
    if (phase === 'active') {
      const total = durationMinutes * 60;
      Animated.timing(progressAnim, {
        toValue: timeLeft / total,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/) &&
        phase === 'active' && sessionId
      ) {
        try {
          await fetch(`${API_URL}/session/nudge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ circle_id: circleId, distracted_user_id: user?.id || 'unknown' }),
          });
        } catch { /* silent */ }
      }
      appState.current = nextAppState;
    });
    return () => sub.remove();
  }, [phase, sessionId, circleId, user]);

  const toggleFriend = (name: string) => {
    setInvitedFriends(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const startSession = async () => {
    setTimeLeft(durationMinutes * 60);
    progressAnim.setValue(1);
    setPhase('active');
    try {
      const res = await fetch(`${API_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || 'unknown', circle_id: circleId, current_topic: title }),
      });
      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
    } catch { /* silent */ }
  };

  const handleEndSession = async () => {
    const total = durationMinutes * 60;
    const studied = Math.floor((total - timeLeft) / 60);
    setIsPaused(true);
    if (sessionId && studied > 0) {
      try {
        await fetch(`${API_URL}/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, user_id: user?.id || 'unknown', xp_earned: studied * 2 }),
        });
      } catch { /* silent */ }
    }
    router.back();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (phase === 'setup') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.shell} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Initiate Focus</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Session title */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SESSION TITLE</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="What are you studying?"
              placeholderTextColor={colors.textSecondary + '60'}
            />
          </View>

          {/* Duration */}
          <Text style={[styles.fieldLabel, { marginTop: 28, color: colors.textSecondary }]}>DURATION LIMIT</Text>
          <View style={styles.presetRow}>
            {PRESET_TIMES.map(mins => (
              <Pressable
                key={mins}
                style={[styles.presetBtn, { backgroundColor: colors.surface, borderColor: colors.border }, durationMinutes === mins && { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setDurationMinutes(mins)}
              >
                <Text style={[styles.presetText, { color: colors.textSecondary }, durationMinutes === mins && { color: colors.accent }]}>
                  {mins}m
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Friends */}
          <View style={styles.friendsHeader}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>INVITE CIRCLE FRIENDS</Text>
            <View style={[styles.connectedPill, { backgroundColor: colors.accentSecondary, borderColor: `${colors.accent}40` }]}>
              <Text style={[styles.connectedText, { color: colors.accent }]}>{invitedFriends.size} Connected</Text>
            </View>
          </View>
          <View style={styles.friendsList}>
            {FRIENDS_LIST.map(name => {
              const invited = invitedFriends.has(name);
              return (
                <Pressable
                  key={name}
                  style={[styles.friendCard, { backgroundColor: colors.surface, borderColor: colors.border }, invited && { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => toggleFriend(name)}
                >
                  <View style={[styles.friendAvatar, { backgroundColor: colors.surfaceSecondary }, invited && { backgroundColor: `${colors.accent}30` }]}>
                    <Text style={[styles.friendAvatarText, { color: colors.text }]}>{name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.friendName, { color: colors.textSecondary }, invited && { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.friendXp, { color: colors.textSecondary }]}>Focus • 1440 XP</Text>
                  </View>
                  {invited && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Start CTA */}
          <Pressable style={[styles.startBtn, { backgroundColor: colors.accent }]} onPress={startSession}>
            <Zap size={18} color={scheme === 'light' ? '#fff' : '#111827'} fill={scheme === 'light' ? '#fff' : '#111827'} />
            <Text style={[styles.startBtnText, { color: scheme === 'light' ? '#fff' : '#111827' }]}>START FOCUSED SESSION</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Active session
  const total = durationMinutes * 60;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.shell}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Active Session</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={[styles.subhead, { color: colors.textSecondary }]}>Deep focus mode</Text>

        {/* Timer */}
        <View style={[styles.timerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>TIME REMAINING</Text>
          <Text style={[styles.timerValue, { color: colors.text }, isPaused && { color: colors.textSecondary }]}>
            {formatTime(timeLeft)}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* Tracking */}
        <View style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.trackLabel, { color: colors.textSecondary }]}>CURRENTLY TRACKING</Text>
          <Text style={[styles.trackName, { color: colors.text }]}>{title}</Text>
        </View>

        {/* In session with */}
        {invitedFriends.size > 0 && (
          <View style={styles.sessionWithRow}>
            <Text style={[styles.sessionWithLabel, { color: colors.textSecondary }]}>In session with you</Text>
            <View style={styles.sessionAvatarRow}>
              {Array.from(invitedFriends).map((name, idx) => (
                <View key={name} style={[styles.sessionAvatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.background, marginLeft: idx === 0 ? 0 : -10 }]}>
                  <Text style={[styles.sessionAvatarText, { color: colors.text }]}>{name[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mascot */}
        <View style={[styles.mascotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.mascotBubble}>
            <Text style={[styles.mascotText, { color: colors.textSecondary }]}>Stay with it — this streak is heat.</Text>
          </View>
          <Image
            source={require('@/brand_assets/happy_bear.png')}
            style={styles.mascotImage}
            contentFit="contain"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.pauseBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isPaused && { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setIsPaused(!isPaused)}
          >
            <Text style={[styles.pauseBtnText, { color: colors.textSecondary }, isPaused && { color: colors.accent }]}>
              {isPaused ? 'RESUME SESSION' : 'PAUSE SESSION'}
            </Text>
          </Pressable>
          <Pressable style={[styles.endBtn, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleEndSession}>
            <Text style={[styles.endBtnText, { color: colors.error }]}>END EARLY</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  shell: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: Fonts?.secondary ?? 'system' },
  subhead: { color: '#4B5563', fontSize: 13, fontFamily: Fonts?.body ?? 'system', textAlign: 'center', marginBottom: 28 },

  fieldLabel: {
    color: '#4B5563', fontSize: 10,
    fontFamily: Fonts?.label ?? 'system', letterSpacing: 2, marginBottom: 12,
  },
  inputWrap: {
    backgroundColor: '#0D1117',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    marginBottom: 4,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.body ?? 'system',
  },

  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  presetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    backgroundColor: '#0D1117',
    alignItems: 'center',
  },
  presetBtnActive: { borderColor: '#0D9488', backgroundColor: '#022C22' },
  presetText: { color: '#4B5563', fontSize: 14, fontFamily: Fonts?.secondary ?? 'system' },
  presetTextActive: { color: '#0D9488' },

  friendsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  connectedPill: {
    backgroundColor: '#022C22', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#10B98140',
  },
  connectedText: { color: '#10B981', fontSize: 11, fontFamily: Fonts?.label ?? 'system' },

  friendsList: { gap: 10, marginBottom: 32 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0D1117',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  friendCardActive: { borderColor: '#0D9488', backgroundColor: '#012018' },
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarActive: { backgroundColor: '#0D948830' },
  friendAvatarText: { color: '#FFFFFF', fontSize: 16, fontFamily: Fonts?.primary ?? 'system' },
  friendName: { color: '#94A3B8', fontSize: 14, fontFamily: Fonts?.bodyMedium ?? 'system' },
  friendNameActive: { color: '#FFFFFF' },
  friendXp: { color: '#4B5563', fontSize: 11, fontFamily: Fonts?.body ?? 'system', marginTop: 2 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#FFFFFF', fontSize: 13 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    paddingVertical: 18,
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 16, color: 'rgba(251,191,36,0.3)' }],
  },
  startBtnText: { color: '#111827', fontSize: 14, fontFamily: Fonts?.secondary ?? 'system', letterSpacing: 1.5 },

  // Active session
  timerCard: {
    backgroundColor: '#161F2E',
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  timerLabel: { color: '#4B5563', fontSize: 10, fontFamily: Fonts?.label ?? 'system', letterSpacing: 2, marginBottom: 12 },
  timerValue: { color: '#FFFFFF', fontSize: 64, fontFamily: Fonts?.primary ?? 'system', letterSpacing: -2 },
  timerValuePaused: { color: '#334155' },
  progressTrack: {
    width: '100%', height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2, marginTop: 20, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: '#0D9488', borderRadius: 2 },

  trackCard: {
    backgroundColor: '#0D1117',
    borderRadius: 16, padding: 20,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#1E293B',
  },
  trackLabel: { color: '#4B5563', fontSize: 10, fontFamily: Fonts?.label ?? 'system', letterSpacing: 2, marginBottom: 8 },
  trackName: { color: '#FFFFFF', fontSize: 17, fontFamily: Fonts?.secondary ?? 'system' },

  sessionWithRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sessionWithLabel: { color: '#4B5563', fontSize: 12, fontFamily: Fonts?.body ?? 'system' },
  sessionAvatarRow: { flexDirection: 'row' },
  sessionAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#111827',
  },
  sessionAvatarText: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonts?.primary ?? 'system' },

  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F2E',
    borderRadius: 16, padding: 16,
    marginBottom: 28,
    borderWidth: 1, borderColor: '#1E293B',
    gap: 16,
  },
  mascotBubble: { flex: 1 },
  mascotText: { color: '#64748B', fontSize: 14, fontFamily: Fonts?.body ?? 'system', fontStyle: 'italic', lineHeight: 20 },
  mascotImage: { width: 60, height: 60 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  pauseBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: '#1E293B', backgroundColor: '#0D1117',
    alignItems: 'center',
  },
  pauseBtnActive: { borderColor: '#0D9488', backgroundColor: '#022C22' },
  pauseBtnText: { color: '#64748B', fontSize: 12, fontFamily: Fonts?.secondary ?? 'system', letterSpacing: 1 },
  pauseBtnTextActive: { color: '#0D9488' },
  endBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: '#7F1D1D', backgroundColor: '#0D1117',
    alignItems: 'center',
  },
  endBtnText: { color: '#EF4444', fontSize: 12, fontFamily: Fonts?.secondary ?? 'system', letterSpacing: 1 },
});
