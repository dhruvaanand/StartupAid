import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';

type Member = {
  id: string;
  name: string;
  status: 'studying' | 'idle' | 'distracted';
  topic?: string;
  minutes?: number;
};

type FeedItem = {
  id: string;
  author: string;
  type: 'note' | 'link';
  content: string;
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const courseName = useMemo(() => {
    if (id === 'os') return 'OS & CPU Scheduling';
    if (id === 'db') return 'Databases';
    if (id === 'algo') return 'Algorithms';
    return 'Study Circle';
  }, [id]);

  const members: Member[] = useMemo(
    () => [
      { id: '1', name: 'Tejas', status: 'studying', topic: 'CPU Scheduling', minutes: 23 },
      { id: '2', name: 'Atharva', status: 'studying', topic: 'Deadlock', minutes: 8 },
      { id: '3', name: 'Rohan', status: 'distracted' },
      { id: '4', name: 'Pudie', status: 'idle' },
    ],
    [],
  );

  const feed: FeedItem[] = useMemo(
    () => [
      { id: 'f1', author: 'Tejas', type: 'link', content: 'Great CPU scheduling explainer: tinyurl.com/cpu-notes' },
      { id: 'f2', author: 'Atharva', type: 'note', content: 'Deadlock patterns from last year’s midterm.' },
    ],
    [],
  );

  const startFocus = () => {
    router.push(`/focus/${id ?? 'os'}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <Text style={styles.courseTitle}>{courseName}</Text>
        <Text style={styles.courseSubtitle}>Circle members right now</Text>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <View style={styles.memberLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberStatus}>{renderStatusLine(item)}</Text>
                </View>
              </View>
              <View style={getStatusChipStyle(item.status)}>
                <View style={getStatusDotStyle(item.status)} />
                <Text style={getStatusChipTextStyle(item.status)}>
                  {item.status === 'studying'
                    ? 'Studying'
                    : item.status === 'idle'
                      ? 'Idle'
                      : 'Distracted'}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Circle feed</Text>
          <Text style={styles.feedHint}>Drop notes and links your circle can use.</Text>
        </View>

        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          style={styles.feedList}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={styles.feedCard}>
              <Text style={styles.feedAuthor}>{item.author}</Text>
              <Text style={styles.feedContent}>{item.content}</Text>
            </View>
          )}
        />

        <Pressable style={styles.focusButton} onPress={startFocus}>
          <MaterialIcons name="timer" size={20} color="#FFFFFF" />
          <Text style={styles.focusButtonText}>Start focus session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function renderStatusLine(m: Member) {
  if (m.status === 'studying' && m.topic && m.minutes != null) {
    return `Studying ${m.topic} · ${m.minutes} min`;
  }
  if (m.status === 'distracted') {
    return 'Switched away · needs a nudge';
  }
  return 'Ready to focus';
}

const getStatusChipStyle = (status: Member['status']) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor:
    status === 'studying' ? '#022C22' : status === 'idle' ? '#0F172A' : '#3F1F1F',
});

const getStatusDotStyle = (status: Member['status']) => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor:
    status === 'studying' ? '#22C55E' : status === 'idle' ? '#64748B' : '#FB923C',
});

const getStatusChipTextStyle = (status: Member['status']) => ({
  color: status === 'distracted' ? '#F97316' : '#E5E7EB',
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
  membersList: {
    maxHeight: 220,
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
  feedList: {
    maxHeight: 180,
  },
  feedCard: {
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  feedAuthor: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
    marginBottom: 2,
  },
  feedContent: {
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

