import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Users, 
  FileUp, 
  Clock, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';

import { Fonts, Palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ResourceCard } from '@/components/ResourceCard';
import { useTheme } from '@/context/theme-context';
import { API_URL } from '@/constants/api';

type SessionMember = {
  id: string;
  name: string;
  isActive: boolean;
  topic: string;
  startedAt: string | null;
};

type Resource = {
  id: string;
  name: string;
  size_bytes: number;
  created_at: string;
  url: string;
};

type QuizRow = {
  quiz_id: string;
  topic_name: string;
  closes_at: string;
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { scheme } = useTheme();
  const colors = Palette[scheme];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circleName, setCircleName] = useState('Circle');
  const [courseCode, setCourseCode] = useState('');
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizRow[]>([]);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);

  // PDF Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const trayLift = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // ── Breathing effect during upload
  useEffect(() => {
    if (uploading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [uploading]);

  // ── Show realtime toast
  const showToast = (msg: string) => {
    setRealtimeToast(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setRealtimeToast(null));
  };

  // ── Fetch circle data
  const fetchCircleData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const { data: circleRow, error: circleErr } = await supabase
        .from('circles')
        .select('id, name, course_code')
        .eq('id', id)
        .single();
      if (circleErr) throw circleErr;
      if (circleRow?.name) setCircleName(circleRow.name);
      if (circleRow?.course_code) setCourseCode(circleRow.course_code);

      const { data: sessionRows, error: sessionErr } = await supabase
        .from('study_sessions')
        .select('id, is_active, started_at, current_topic, users(name)')
        .eq('circle_id', id)
        .eq('is_active', true);
      if (sessionErr) throw sessionErr;

      setMembers(
        (sessionRows ?? []).map((row: any, idx: number) => ({
          id: row.id ?? `session-${idx}`,
          name: row.users?.name ?? 'User',
          isActive: Boolean(row.is_active),
          topic: row.current_topic ?? 'Focus topic',
          startedAt: row.started_at ?? null,
        }))
      );

      // Resources
      const resResp = await fetch(`${API_URL}/circle/${id}/resources`);
      const resData = await resResp.json();
      if (Array.isArray(resData)) setResources(resData);

      // Recent quizzes
      const quizResp = await fetch(`${API_URL}/circle/${id}/quizzes`);
      if (quizResp.ok) {
        const quizData = await quizResp.json();
        if (Array.isArray(quizData)) setRecentQuizzes(quizData.slice(0, 3));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load circle');
    } finally {
      setLoading(false);
    }
  };

  // ── Supabase real-time subscription
  useEffect(() => {
    if (!id) return;
    void fetchCircleData();

    const channel = supabase
      .channel(`circle-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `circle_id=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (payload.eventType === 'INSERT' && row?.is_active) {
            showToast('A member just started studying');
            void fetchCircleData();
          } else if (payload.eventType === 'UPDATE' && !row?.is_active) {
            showToast('A member ended their session');
            void fetchCircleData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nudges',
          filter: `circle_id=eq.${id}`,
        },
        (payload) => {
          showToast('Someone got distracted');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quizzes',
          filter: `circle_id=eq.${id}`,
        },
        (payload) => {
          showToast('A new quiz was created!');
          void fetchCircleData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Start Focus
  const startFocus = () => {
    router.push(`/focus/${id ?? ''}`);
  };

  // ── Start Quiz (Practice flow as requested)
  const startQuiz = () => {
    if (!courseCode) {
      Alert.alert('Error', 'Missing course information for practice.');
      return;
    }
    router.push(`/quiz/${courseCode}`);
  };

  // ── Invite user
  const handleInvite = async () => {
    if (!inviteUserId.trim()) return;
    try {
      setInviting(true);
      const res = await fetch(`${API_URL}/circle/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: inviteUserId.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert(data.error.code ?? 'Error', data.error.message ?? 'Failed to invite.');
      } else {
        Alert.alert('Invited!', 'User added to the circle.');
        setShowInvite(false);
        setInviteUserId('');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to invite.');
    } finally {
      setInviting(false);
    }
  };

  // ── PDF upload
  const pickPDF = async () => {
    if (uploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 20 * 1024 * 1024) {
        Alert.alert('File too large', 'PDFs must be under 20MB.');
        return;
      }
      setSelectedFile(file);
      Animated.spring(trayLift, { toValue: 1, useNativeDriver: false }).start();
    } catch (err) {
      console.error('Picker error', err);
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile || !id || !user) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `${id}/${fileName}`;
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const { error: storageErr } = await supabase.storage
        .from('circle-resources')
        .upload(filePath, blob, { contentType: 'application/pdf', upsert: true });
      if (storageErr) throw new Error(storageErr.message);
      const { data: { publicUrl } } = supabase.storage.from('circle-resources').getPublicUrl(filePath);
      await fetch(`${API_URL}/resource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circle_id: id,
          user_id: user.id,
          name: selectedFile.name || 'document.pdf',
          url: publicUrl,
          mimetype: 'application/pdf',
          size_bytes: selectedFile.size || 0,
        }),
      });
      const successName = selectedFile.name;
      setSelectedFile(null);
      Animated.spring(trayLift, { toValue: 0, useNativeDriver: false }).start();
      void fetchCircleData();
      Alert.alert('Success', `Vault updated with ${successName}`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const mappedMembers = useMemo(
    () =>
      members.map((m) => {
        const minutes = m.startedAt
          ? Math.floor((Date.now() - new Date(m.startedAt).getTime()) / 60000)
          : 0;
        return {
          ...m,
          minutes,
          statusLabel: m.isActive ? 'Studying' : 'Distracted',
          statusTone: m.isActive ? 'studying' : 'distracted',
        };
      }),
    [members]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Circle' }} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Circle' }} />
        <View style={styles.centerState}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn't load circle</Text>
          <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={() => void fetchCircleData()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: circleName }} />

      {/* Real-time toast */}
      {realtimeToast && (
        <Animated.View style={[styles.realtimeToast, { opacity: toastAnim, backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.realtimeToastText, { color: colors.accent }]}>{realtimeToast}</Text>
        </Animated.View>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Invite to Circle</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Enter their user ID</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={inviteUserId}
              onChangeText={setInviteUserId}
              placeholder="User ID (UUID)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => { setShowInvite(false); setInviteUserId(''); }}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirm, { backgroundColor: colors.accent }]} onPress={handleInvite} disabled={inviting}>
                {inviting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalConfirmText}>Invite</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={styles.shell}>
        <FlatList
          data={mappedMembers}
          keyExtractor={(item) => item.id}
          style={[styles.membersList, { overflow: 'visible' }]}
          contentContainerStyle={{ gap: 16, paddingTop: 10, paddingBottom: 120 }}
          ListHeaderComponent={
            <>
              <Text style={[styles.courseTitle, { color: colors.text }]}>{circleName}</Text>
              <Text style={[styles.courseSubtitle, { color: colors.textSecondary }]}>Circle members right now</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.memberOuter}>
              <View style={styles.memberInner}>
                <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active members right now.</Text>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.memberOuter, { shadowColor: colors.shadow }]}>
              <View style={[styles.memberInner, { shadowColor: colors.shadowDark }]}>
                <View style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.memberLeft}>
                    <View style={[styles.avatarOuter, { shadowColor: colors.shadow }]}>
                      <View style={[styles.avatarInner, { shadowColor: colors.shadowDark }]}>
                        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                          <Text style={[styles.avatarText, { color: colors.text }]}>{item.name[0]}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.memberStatus, { color: colors.textSecondary }]}>
                        {item.isActive
                          ? `Studying ${item.topic} · ${item.minutes} min`
                          : 'Switched away'}
                      </Text>
                    </View>
                  </View>
                  <View style={getStatusChipStyle(item.statusTone as 'studying' | 'distracted', colors)}>
                    <View style={getStatusDotStyle(item.statusTone as 'studying' | 'distracted', colors)} />
                    <Text style={getStatusChipTextStyle(item.statusTone as 'studying' | 'distracted', colors)}>{item.statusLabel}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={
            <>
              {/* Recent Quizzes */}
              {recentQuizzes.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Quizzes</Text>
                  {recentQuizzes.map((quiz) => {
                    const now = new Date();
                    const closes = new Date(quiz.closes_at);
                    const isOpen = now < closes;
                    return (
                      <Pressable
                        key={quiz.quiz_id}
                        style={[styles.quizRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push(`/quiz/${quiz.quiz_id}`)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quizTopic, { color: colors.text }]}>{quiz.topic_name}</Text>
                          <Text style={[styles.quizStatus, { color: colors.textSecondary }]}>
                            {isOpen ? `Open · closes ${closes.toLocaleTimeString()}` : 'Closed'}
                          </Text>
                        </View>
                        {isOpen && (
                          <View style={[styles.openBadge, { backgroundColor: colors.accentSecondary, borderColor: `${colors.accent}40` }]}>
                            <Text style={[styles.openBadgeText, { color: colors.accent }]}>OPEN</Text>
                          </View>
                        )}
                        <ChevronRight size={20} color={colors.textSecondary} />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* PDF Vault */}
              <View style={styles.vaultHeader}>
                <Text style={[styles.feedTitle, { color: colors.text }]}>PDF Resource Vault</Text>
                <Text style={[styles.feedHint, { color: colors.textSecondary }]}>High-utility study materials only.</Text>
              </View>

              <Animated.View style={[styles.slotOuter, { shadowColor: colors.shadow }, uploading && { transform: [{ scale: pulseAnim }] }]}>
                <Animated.View style={[styles.slotInner, { shadowColor: colors.shadowDark }]}>
                  <Pressable
                    onPress={selectedFile ? uploadPDF : pickPDF}
                    style={[styles.pdfTray, { backgroundColor: colors.surface, borderColor: colors.border }, selectedFile && { borderColor: colors.success, backgroundColor: `${colors.success}10`, borderStyle: 'solid' }]}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : selectedFile ? (
                      <View style={styles.traySelectedContent}>
                        <CheckCircle size={28} color={colors.success} />
                        <Text style={[styles.trayMainText, { color: colors.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={[styles.traySubText, { color: colors.textSecondary }]}>Tap to upload PDF</Text>
                      </View>
                    ) : (
                      <View style={styles.trayEmptyContent}>
                        <FileUp size={28} color={colors.textSecondary} />
                        <Text style={[styles.trayMainText, { color: colors.text }]}>PDF Slot</Text>
                        <Text style={[styles.traySubText, { color: colors.textSecondary }]}>Under 20MB</Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              </Animated.View>

              <View style={styles.resourceList}>
                {resources.length === 0 ? (
                  <View style={styles.memberOuter}>
                    <View style={styles.memberInner}>
                      <View style={[styles.feedPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.feedPlaceholderText, { color: colors.textSecondary }]}>The vault is empty. Be the first to drop a PDF.</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  resources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      name={res.name}
                      sizeBytes={res.size_bytes}
                      createdAt={res.created_at}
                      url={res.url}
                    />
                  ))
                )}
              </View>

              {/* CTA Row */}
              <View style={styles.ctaContainer}>
                <Pressable style={[styles.inviteButtonOuter, { shadowColor: colors.shadow }]} onPress={() => setShowInvite(true)}>
                  <View style={[styles.inviteButtonInner, { shadowColor: colors.shadowDark }]}>
                    <View style={[styles.inviteButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Plus size={20} color={colors.textSecondary} />
                      <Text style={[styles.inviteButtonText, { color: colors.textSecondary }]}>INVITE</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable style={[styles.quizBtnOuter, { shadowColor: colors.shadowDark }]} onPress={startQuiz}>
                  <View style={[styles.quizBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Sparkles size={20} color={colors.accent} />
                    <Text style={[styles.quizBtnText, { color: colors.accent }]}>QUIZ</Text>
                  </View>
                </Pressable>

                <Pressable style={[styles.startBtnOuter, { shadowColor: colors.shadowDark }]} onPress={startFocus}>
                  <LinearGradient 
                    colors={scheme === 'dark' ? ['#6bd8cb', '#29a195'] : ['#0d9488', '#0f766e']} 
                    style={styles.startBtn}
                  >
                    <Clock size={20} color="white" />
                    <Text style={styles.startBtnText}>FOCUS</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const getStatusChipStyle = (status: 'studying' | 'distracted', colors: any) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 99,
  backgroundColor: status === 'studying' ? colors.surfaceSecondary : `${colors.error}10`,
  borderWidth: 1.5,
  borderColor: status === 'studying' ? `${colors.success}40` : `${colors.error}40`,
});

const getStatusDotStyle = (status: 'studying' | 'distracted', colors: any) => ({
  width: 8, height: 8, borderRadius: 4,
  backgroundColor: status === 'studying' ? colors.success : colors.error,
});

const getStatusChipTextStyle = (status: 'studying' | 'distracted', colors: any) => ({
  color: status === 'studying' ? colors.text : colors.error,
  fontSize: 11, fontWeight: '800' as const,
  fontFamily: Fonts.primary,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  shell: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 24, paddingTop: 10 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  errorTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', fontFamily: Fonts.primary, textAlign: 'center' },
  errorBody: { color: '#94A3B8', fontSize: 15, fontFamily: Fonts.body, textAlign: 'center' },
  retryBtn: { backgroundColor: '#0D9488', borderRadius: 99, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: '#FFF', fontWeight: '700', fontFamily: Fonts.secondary },
  // Toast
  realtimeToast: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#0D948820',
    borderWidth: 1,
    borderColor: '#0D948860',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  realtimeToastText: { color: '#5EEAD4', fontSize: 13, fontWeight: '600', fontFamily: Fonts.secondary, textAlign: 'center' },
  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 500,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#1F2937', borderRadius: 24, padding: 24,
    width: '85%', borderWidth: 1, borderColor: '#374151',
  },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', fontFamily: Fonts.primary, marginBottom: 6 },
  modalSubtitle: { color: '#94A3B8', fontSize: 13, fontFamily: Fonts.body, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#374151',
    color: '#FFF', fontFamily: Fonts.primary, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#374151',
    paddingVertical: 12, alignItems: 'center',
  },
  modalCancelText: { color: '#94A3B8', fontWeight: '700', fontFamily: Fonts.secondary },
  modalConfirm: {
    flex: 1, borderRadius: 12, backgroundColor: '#0D9488',
    paddingVertical: 12, alignItems: 'center',
  },
  modalConfirmText: { color: '#FFF', fontWeight: '800', fontFamily: Fonts.primary },
  // Members
  courseTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', fontFamily: Fonts.primary, marginTop: 10 },
  courseSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600', fontFamily: Fonts.secondary, marginTop: 8, marginBottom: 16 },
  membersList: { flex: 1 },
  memberOuter: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  memberInner: { borderRadius: 24 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#020617', borderRadius: 24,
    paddingVertical: 18, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: '#0F172A',
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatarOuter: { borderRadius: 99 },
  avatarInner: { borderRadius: 99 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#374151',
  },
  avatarText: { color: '#E5E7EB', fontSize: 18, fontWeight: '800', fontFamily: Fonts.primary },
  memberName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', fontFamily: Fonts.secondary },
  memberStatus: { color: '#94A3B8', fontSize: 12, fontWeight: '400', fontFamily: Fonts.body, marginTop: 3 },
  emptyCard: {
    backgroundColor: '#020617', borderRadius: 24,
    paddingVertical: 20, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: '#0F172A',
  },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '400', fontFamily: Fonts.body },
  // Quizzes
  sectionBlock: { marginTop: 24, marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', fontFamily: Fonts.primary, marginBottom: 12 },
  quizRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1F2937', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, borderWidth: 1, borderColor: '#374151',
  },
  quizTopic: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: Fonts.secondary },
  quizStatus: { color: '#64748B', fontSize: 12, fontFamily: Fonts.body, marginTop: 3 },
  openBadge: {
    backgroundColor: '#022C22', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: '#10B98140',
  },
  openBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800', fontFamily: Fonts.primary },
  // Vault
  vaultHeader: { marginTop: 28, marginBottom: 14 },
  feedTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', fontFamily: Fonts.primary },
  feedHint: { color: '#94A3B8', fontSize: 13, fontWeight: '400', fontFamily: Fonts.body, marginTop: 4 },
  slotOuter: { borderRadius: 24, marginBottom: 16 },
  slotInner: { borderRadius: 24 },
  pdfTray: {
    backgroundColor: '#111827', borderRadius: 24, height: 110,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0F172A', borderStyle: 'dashed',
  },
  trayEmptyContent: { alignItems: 'center', gap: 8 },
  traySelectedContent: { alignItems: 'center', gap: 4, paddingHorizontal: 20 },
  trayMainText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: Fonts.primary },
  traySubText: { color: '#64748B', fontSize: 12, fontWeight: '400', fontFamily: Fonts.body },
  resourceList: { marginTop: 8 },
  feedPlaceholder: {
    backgroundColor: '#020617', borderRadius: 24,
    paddingVertical: 24, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: '#0F172A',
  },
  feedPlaceholderText: { color: '#64748B', fontSize: 14, fontWeight: '400', fontFamily: Fonts.body, textAlign: 'center' },
  // CTA row
  ctaContainer: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 40 },
  inviteButtonOuter: { flex: 1, borderRadius: 20 },
  inviteButtonInner: { borderRadius: 20 },
  inviteButton: {
    backgroundColor: '#020617', paddingVertical: 16, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#1e293b',
  },
  inviteButtonText: { color: '#64748B', fontSize: 12, fontWeight: '800', fontFamily: Fonts.primary, letterSpacing: 1 },
  quizBtnOuter: { flex: 1, borderRadius: 20 },
  quizBtn: {
    backgroundColor: '#1c1917', paddingVertical: 16, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: '#44403c',
  },
  quizBtnText: { color: '#a8a29e', fontSize: 12, fontWeight: '800', fontFamily: Fonts.primary, letterSpacing: 1 },
  startBtnOuter: { flex: 2, borderRadius: 20 },
  startBtn: { paddingVertical: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startBtnText: { color: 'white', fontSize: 14, fontWeight: '800', fontFamily: Fonts.primary, letterSpacing: -0.5 },
});
