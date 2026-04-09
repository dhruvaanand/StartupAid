import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View, TextInput, ScrollView, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';

const PRESET_TIMES = [15, 25, 45, 60];
const FRIENDS_LIST = ['Tejas', 'Pudie', 'Atharva', 'Rohan'];
const USER_ID = 'a0000001-0000-0000-0000-000000000001';

export default function FocusSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const circleId = id || 'test-circle';

  const defaultCourseName =
    id?.toLowerCase() === 'cs1.201' ? 'Data Structures' : 
    id?.toLowerCase() === 'os' ? 'OS & CPU Scheduling' : 
    id?.toLowerCase() === 'db' ? 'Databases' : 
    id?.toUpperCase() || 'Focus Session';

  // State
  const [phase, setPhase] = useState<'setup' | 'active'>('setup');
  const [title, setTitle] = useState(defaultCourseName + ' Deep Dive');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set(['Tejas']));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  
  // Active Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'active' && timeLeft === 0) {
      handleEndSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, isPaused, timeLeft]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/) &&
        phase === 'active' && 
        sessionId
      ) {
        // App went to background mid-session
        try {
          await fetch('http://localhost:8000/session/nudge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              circle_id: circleId,
              distracted_user_id: USER_ID
            })
          });
        } catch (e) {
          console.error('Failed to nudge', e);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [phase, sessionId, circleId]);

  const toggleFriend = (name: string) => {
    setInvitedFriends(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const startSession = async () => {
    setTimeLeft(durationMinutes * 60);
    setPhase('active');
    try {
      const res = await fetch('http://localhost:8000/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          circle_id: circleId,
          current_topic: title
        })
      });
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }
    } catch (e) {
      console.error('Failed to start session API:', e);
    }
  };

  const handleEndSession = async () => {
    const totalSeconds = durationMinutes * 60;
    const timeStudiedSeconds = totalSeconds - timeLeft;
    const minutesStudied = Math.floor(timeStudiedSeconds / 60);
    
    setIsPaused(true);

    if (sessionId && minutesStudied > 0) {
      try {
        await fetch('http://localhost:8000/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: USER_ID,
            xp_earned: minutesStudied * 2
          })
        });
      } catch (e) {
        console.error('Failed to end session API:', e);
      }
    }
    router.back();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (phase === 'setup') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.shell} contentContainerStyle={styles.scrollContext}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="close" size={24} color="#E5E7EB" />
            </Pressable>
            <Text style={styles.headerTitle}>New Focus Session</Text>
          </View>

          <View style={styles.setupCard}>
            <Text style={styles.setupLabel}>Session Title</Text>
            <TextInput 
              style={styles.setupInput}
              value={title}
              onChangeText={setTitle}
              placeholder="What are you studying?"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.setupLabel, { marginTop: 24 }]}>Duration Limit</Text>
            <View style={styles.presetRow}>
              {PRESET_TIMES.map(mins => (
                <Pressable 
                  key={mins}
                  style={[styles.presetBtn, durationMinutes === mins && styles.presetBtnActive]}
                  onPress={() => setDurationMinutes(mins)}
                >
                  <Text style={[styles.presetText, durationMinutes === mins && styles.presetTextActive]}>
                    {mins}m
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.setupLabel, { marginTop: 24 }]}>Invite Circle Friends</Text>
            <View style={styles.friendsList}>
              {FRIENDS_LIST.map(name => {
                const isInvited = invitedFriends.has(name);
                return (
                  <Pressable 
                    key={name}
                    style={[styles.friendCard, isInvited && styles.friendCardActive]}
                    onPress={() => toggleFriend(name)}
                  >
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarMiniText}>{name[0]}</Text>
                    </View>
                    <Text style={[styles.friendName, isInvited && styles.friendNameActive]}>{name}</Text>
                    {isInvited && <MaterialIcons name="check-circle" size={16} color="#34D399" style={{marginLeft: 'auto'}} />}
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Pressable style={styles.startHeroBtn} onPress={startSession}>
            <Text style={styles.startHeroBtnText}>Start Focused Session</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={24} color="#E5E7EB" />
          </Pressable>
          <Text style={styles.headerTitle}>Active Session</Text>
        </View>

        <Text style={styles.subhead}>Deep focus mode</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Time remaining</Text>
          <Text style={[styles.timerValue, isPaused && styles.timerValuePaused]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <View style={styles.topicCard}>
          <Text style={styles.topicLabel}>Current Tracking</Text>
          <Text style={styles.topicActiveName}>{title}</Text>
        </View>

        {invitedFriends.size > 0 && (
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>In session with you</Text>
            <View style={styles.avatarRow}>
              {Array.from(invitedFriends).map((name, idx) => (
                <View
                  key={name}
                  style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -10 }]}>
                  <Text style={styles.avatarText}>{name[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.mascotCard}>
          <View style={styles.mascotBubble}>
            <Text style={styles.mascotText}>Stay with it — this streak is heat.</Text>
          </View>
          <View style={styles.mascotCircle}>
            <MaterialIcons name="pets" size={40} color="#FB923C" />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable 
            style={[styles.softButton, isPaused && styles.softButtonActive]} 
            onPress={() => setIsPaused(!isPaused)}>
            <Text style={[styles.softButtonText, isPaused && styles.softButtonTextActive]}>
              {isPaused ? 'Resume Timer' : 'Pause Session'}
            </Text>
          </Pressable>
          <Pressable style={styles.endButton} onPress={handleEndSession}>
            <Text style={styles.endButtonText}>End Early</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  shell: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  scrollContext: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  // Setup Styles
  setupCard: {
    marginTop: 16,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  setupLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
    marginBottom: 8,
  },
  setupInput: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    fontFamily: Fonts.primary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetBtnActive: {
    backgroundColor: '#0D948820',
    borderColor: '#0D9488',
  },
  presetText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  presetTextActive: {
    color: '#5EEAD4',
  },
  friendsList: {
    gap: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  friendCardActive: {
    borderColor: '#34D399',
    backgroundColor: '#064E3B20',
  },
  avatarMini: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarMiniText: {
    color: '#E5E7EB',
    fontWeight: '900',
    fontSize: 12,
    fontFamily: Fonts.primary,
  },
  friendName: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: Fonts.secondary,
  },
  friendNameActive: {
    color: '#34D399',
  },
  startHeroBtn: {
    marginTop: 32,
    backgroundColor: '#FB923C',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startHeroBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    fontFamily: Fonts.primary,
  },
  
  // Timer Styles
  subhead: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  timerCard: {
    marginTop: 16,
    backgroundColor: '#020617',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  timerValue: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  timerValuePaused: {
    color: '#64748B',
  },
  topicCard: {
    marginTop: 16,
    backgroundColor: '#0D948810',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#0D948830',
  },
  topicLabel: {
    color: '#A5F3FC',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  topicActiveName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
    marginTop: 4,
  },
  sessionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLabel: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  avatarText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  mascotCard: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  mascotBubble: {
    flex: 1,
    marginRight: 12,
    backgroundColor: '#020617',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mascotText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  mascotCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#022C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 10,
  },
  softButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 14,
    alignItems: 'center',
  },
  softButtonActive: {
    backgroundColor: '#1E293B',
  },
  softButtonText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  softButtonTextActive: {
    color: '#FFFFFF',
  },
  endButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
});
