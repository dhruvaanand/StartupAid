import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type SessionMember = {
  id: string;
  name: string;
  isActive: boolean;
  topic: string;
  startedAt: string | null;
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circleName, setCircleName] = useState('Circle');
  const [members, setMembers] = useState<SessionMember[]>([]);

  useEffect(() => {
    const fetchCircleData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // Circle header name
        const { data: circleRow, error: circleErr } = await supabase
          .from('circles')
          .select('id, name')
          .eq('id', id)
          .single();
        if (circleErr) throw circleErr;
        if (circleRow?.name) setCircleName(circleRow.name);

        // Active sessions in this circle + users join
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
          })),
        );
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load circle');
      } finally {
        setLoading(false);
      }
    };

    void fetchCircleData();
  }, [id]);

  const startFocus = () => {
    router.push(`/focus/${id ?? ''}`);
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
    [members],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: circleName }} />

      <View style={styles.shell}>
        <Text style={styles.courseTitle}>{circleName}</Text>
        <Text style={styles.courseSubtitle}>Circle members right now</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.centerText}>Loading circle…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Couldn&apos;t load circle</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={mappedMembers}
              keyExtractor={(item) => item.id}
              style={styles.membersList}
              contentContainerStyle={{ gap: 10 }}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No active members in this circle right now.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <View style={styles.memberLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      <Text style={styles.memberStatus}>
                        {item.isActive
                          ? `Studying ${item.topic} · ${item.minutes} min`
                          : 'Switched away · needs a nudge'}
                      </Text>
                    </View>
                  </View>

                  <View style={getStatusChipStyle(item.statusTone as 'studying' | 'distracted')}>
                    <View style={getStatusDotStyle(item.statusTone as 'studying' | 'distracted')} />
                    <Text style={getStatusChipTextStyle(item.statusTone as 'studying' | 'distracted')}>{item.statusLabel}</Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Circle feed</Text>
              <Text style={styles.feedHint}>Drop notes and links your circle can use.</Text>
            </View>

            <View style={styles.feedPlaceholder}>
              <Text style={styles.feedPlaceholderText}>No notes yet — drop something useful</Text>
            </View>

            <Pressable style={styles.focusButton} onPress={startFocus}>
              <MaterialIcons name="timer" size={20} color="#FFFFFF" />
              <Text style={styles.focusButtonText}>Start focus session</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStatusChipStyle = (status: 'studying' | 'distracted') => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: status === 'studying' ? '#022C22' : '#3F1F1F',
});

const getStatusDotStyle = (status: 'studying' | 'distracted') => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: status === 'studying' ? '#22C55E' : '#FB923C',
});

const getStatusChipTextStyle = (status: 'studying' | 'distracted') => ({
  color: status === 'studying' ? '#E5E7EB' : '#F97316',
  fontSize: 11,
  fontWeight: '800' as const,
  fontFamily: Fonts.secondary,
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  shell: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  courseSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginTop: 4,
    marginBottom: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  centerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Fonts.primary,
    textAlign: 'center',
  },
  errorBody: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    textAlign: 'center',
  },
  membersList: {
    maxHeight: 260,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  memberStatus: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#020617',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  feedHeader: {
    marginTop: 18,
    marginBottom: 8,
  },
  feedTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  feedHint: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  feedPlaceholder: {
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  feedPlaceholderText: {
    color: '#CBD5F5',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  focusButton: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  focusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
});

