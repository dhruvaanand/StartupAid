import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { Search, ChevronRight } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';

type TopicRow = {
  id: string;
  course_code: string;
  name: string;
  exam_frequency_score: number;
  peer_difficulty_score: number;
  priority_level: string;
};

const COURSES = [
  'MA2.101',
  'CS1.201',
  'CS2.201',
  'CS6.201',
  'CS3.303',
  'EC5.102',
  'EC2.103',
];

const priorityTag = (priority: string): 'HIGH' | 'MEDIUM' | 'SKIP' => {
  const p = (priority ?? '').toUpperCase();
  if (p.includes('HIGH')) return 'HIGH';
  if (p.includes('SKIP')) return 'SKIP';
  return 'MEDIUM';
};

export default function MapScreen() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState('CS1.201');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        setExpandedId(null);

        const { data, error: queryError } = await supabase
          .from('topics')
          .select('id, course_code, name, exam_frequency_score, peer_difficulty_score, priority_level')
          .eq('course_code', selectedCourse)
          .order('exam_frequency_score', { ascending: false });

        if (queryError) throw queryError;
        setTopics((data ?? []) as TopicRow[]);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    void fetchTopics();
  }, [selectedCourse]);

  const renderedTopics = useMemo(() => topics, [topics]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return COURSES;
    return COURSES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const startFocus = (topic: TopicRow) => {
    router.push(`/focus/${selectedCourse.toLowerCase()}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <Text style={styles.title}>Priority Map</Text>

        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a course..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery ? (
          <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled">
            {filteredCourses.map((course) => (
              <Pressable
                key={course}
                onPress={() => {
                  setSelectedCourse(course);
                  setSearchQuery('');
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownItemText}>{course}</Text>
              </Pressable>
            ))}
            {filteredCourses.length === 0 && (
              <Text style={styles.dropdownEmpty}>No courses found.</Text>
            )}
          </ScrollView>
        ) : (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Showing Route For: {selectedCourse}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.centerText}>Loading roadmap…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Couldn&apos;t load roadmap</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : renderedTopics.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerText}>No topics found for this course.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.roadmapScroll}
            contentContainerStyle={styles.roadmapContent}
            showsVerticalScrollIndicator={false}>
            
            <View style={styles.spine} />

            {renderedTopics.map((topic, index) => {
              const tag = priorityTag(topic.priority_level);
              const isLeft = index % 2 === 0;
              const expanded = expandedId === topic.id;

              return (
                <View key={topic.id} style={styles.nodeWrapper}>
                  {/* Spine Node Dot */}
                  <View style={[styles.spineNode, tag === 'HIGH' && { borderColor: '#FB923C' }]} />

                  {/* Widget Card */}
                  <Pressable 
                    onPress={() => setExpandedId(expanded ? null : topic.id)}
                    style={[styles.widgetCard, isLeft ? styles.widgetCardLeft : styles.widgetCardRight]}
                  >
                    <View style={styles.topicHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topicName}>{topic.name}</Text>
                        <View style={[styles.tagPill, tag === 'HIGH' ? styles.tagHigh : tag === 'MEDIUM' ? styles.tagMedium : styles.tagSkip]}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color="#94A3B8" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
                    </View>

                    {expanded && (
                      <View style={styles.expandedDetails}>
                        <Pressable style={styles.studyBtn} onPress={() => startFocus(topic)}>
                          <Text style={styles.studyBtnText}>Start studying this</Text>
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Fonts.primary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#374151',
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.secondary,
  },
  dropdown: {
    maxHeight: 200,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 8,
    zIndex: 20,
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontFamily: Fonts.primary,
    fontWeight: '700',
  },
  dropdownEmpty: {
    padding: 12,
    color: '#94A3B8',
    fontFamily: Fonts.secondary,
    textAlign: 'center',
  },
  selectedBadge: {
    marginTop: 12,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#022C22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  selectedBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: Fonts.secondary,
    marginTop: 10,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: Fonts.primary,
    fontWeight: '900',
  },
  errorBody: {
    color: '#FCA5A5',
    fontFamily: Fonts.secondary,
    marginTop: 4,
  },
  roadmapScroll: {
    flex: 1,
    zIndex: 1,
  },
  roadmapContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  spine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1E293B',
    borderRadius: 999,
  },
  nodeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    width: '100%',
  },
  spineNode: {
    position: 'absolute',
    left: '50%',
    marginLeft: -8,
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 3,
    borderColor: '#0D9488',
    zIndex: 2,
  },
  widgetCard: {
    width: '45%',
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    zIndex: 1,
  },
  widgetCardLeft: {
    marginRight: 'auto',
  },
  widgetCardRight: {
    marginLeft: 'auto',
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.primary,
    marginBottom: 6,
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagHigh: {
    backgroundColor: '#7C2D12',
  },
  tagMedium: {
    backgroundColor: '#064E3B',
  },
  tagSkip: {
    backgroundColor: '#1F2937',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: Fonts.secondary,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  studyBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  studyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
});
