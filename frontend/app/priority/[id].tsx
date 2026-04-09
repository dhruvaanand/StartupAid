import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';

type Topic = {
  id: string;
  name: string;
  importance: 'high' | 'medium' | 'low';
  examWeight: number;
  difficulty: number;
};

export default function PriorityMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const courseName =
    id === 'os' ? 'OS & CPU Scheduling' : id === 'db' ? 'Databases' : 'Priority Map';

  const topics: Topic[] = useMemo(
    () => [
      { id: 't1', name: 'Round Robin scheduling', importance: 'high', examWeight: 0.9, difficulty: 0.6 },
      { id: 't2', name: 'Priority scheduling', importance: 'high', examWeight: 0.8, difficulty: 0.7 },
      { id: 't3', name: 'Multilevel feedback queues', importance: 'medium', examWeight: 0.5, difficulty: 0.8 },
      { id: 't4', name: 'Historical background', importance: 'low', examWeight: 0.2, difficulty: 0.3 },
    ],
    [],
  );

  const startOnTopic = (topic: Topic) => {
    router.push(`/focus/${id ?? 'os'}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={24} color="#E5E7EB" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{courseName}</Text>
            <Text style={styles.headerSubtitle}>Priority map</Text>
          </View>
        </View>

        <Text style={styles.legend}>
          Ranked by past exams + peer difficulty. Hit the 🔥 topics first.
        </Text>

        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 14, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.topicCard}>
              <View style={styles.topicMain}>
                <View style={getBadgeStyle(item.importance)}>
                  <Text style={getBadgeTextStyle(item.importance)}>
                    {item.importance === 'high'
                      ? 'HIGH PRIORITY'
                      : item.importance === 'medium'
                        ? 'MEDIUM'
                        : 'SAFE TO SKIP'}
                  </Text>
                </View>
                <Text style={styles.topicName}>{item.name}</Text>
              </View>

              <View style={styles.topicMetaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Exam frequency</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${item.examWeight * 100}%` }]} />
                  </View>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Peer difficulty</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${item.difficulty * 100}%`, backgroundColor: '#FB923C' },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <Pressable style={styles.topicButton} onPress={() => startOnTopic(item)}>
                <Text style={styles.topicButtonText}>Focus on this</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const getBadgeStyle = (importance: Topic['importance']) => ({
  alignSelf: 'flex-start' as const,
  borderRadius: 999,
  paddingVertical: 4,
  paddingHorizontal: 8,
  backgroundColor:
    importance === 'high' ? '#451A03' : importance === 'medium' ? '#0F172A' : '#020617',
});

const getBadgeTextStyle = (importance: Topic['importance']) => ({
  color:
    importance === 'high' ? '#FDBA74' : importance === 'medium' ? '#A5F3FC' : '#6B7280',
  fontSize: 10,
  fontWeight: '900' as const,
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
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  legend: {
    marginTop: 10,
    color: '#CBD5F5',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  topicCard: {
    backgroundColor: '#020617',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topicMain: {
    marginBottom: 10,
  },
  topicName: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  topicMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginBottom: 2,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0D9488',
  },
  topicButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#0D9488',
  },
  topicButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
});

