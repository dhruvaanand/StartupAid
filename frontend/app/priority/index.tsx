import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Map, Search, Activity, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { API_URL } from '@/constants/api';

// ── Static course manifest ────────────────────────────────
const COURSE_MANIFEST: { code: string; name: string }[] = [
  { code: 'MA2.101',  name: 'Linear Algebra & Calculus II' },
  { code: 'CS1.201',  name: 'Data Structures & Algorithms' },
  { code: 'CS2.201',  name: 'Computer Organisation' },
  { code: 'CS6.201',  name: 'Theory of Computation' },
  { code: 'CS3.303',  name: 'Operating Systems' },
  { code: 'EC5.102',  name: 'Digital Signal Processing' },
  { code: 'EC2.103',  name: 'Analog Circuits' },
];

// Accent bar color driven by dominant priority signal
const SIGNAL_COLORS = {
  HIGH:   '#0D9488',   // teal
  MEDIUM: '#FB923C',   // orange
  SKIP:   '#888780',   // grey
} as const;

type CourseSignal = 'HIGH' | 'MEDIUM' | 'SKIP';

type CourseMeta = {
  code: string;
  name: string;
  signal: CourseSignal;
  topicCount: number;
  paperCount: number;
  loaded: boolean;
};

// ── Helper ─────────────────────────────────────────────────
function deriveSignal(nodes: { priority: string }[]): CourseSignal {
  if (!nodes.length) return 'SKIP';
  const counts = { HIGH: 0, MEDIUM: 0, SKIP: 0 };
  nodes.forEach(n => {
    if (n.priority === 'HIGH') counts.HIGH++;
    else if (n.priority === 'MEDIUM') counts.MEDIUM++;
    else counts.SKIP++;
  });
  if (counts.HIGH >= counts.MEDIUM && counts.HIGH >= counts.SKIP) return 'HIGH';
  if (counts.MEDIUM >= counts.SKIP) return 'MEDIUM';
  return 'SKIP';
}

// ── Card component ─────────────────────────────────────────
function CourseCard({
  course,
  onPress,
  index,
}: {
  course: CourseMeta;
  onPress: () => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  const accentColor = SIGNAL_COLORS[course.signal];
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, { shadowColor: colors.shadow }]}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Card body */}
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              {/* Course code + name */}
              <View style={styles.courseInfo}>
                <Text style={[styles.courseCode, { color: colors.accent }]}>{course.code}</Text>
                <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={2}>
                  {course.name}
                </Text>
              </View>

              {/* Chevron */}
              <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <ChevronRight
                  size={18}
                  color={course.loaded ? accentColor : colors.textSecondary}
                  strokeWidth={2.5}
                />
              </View>
            </View>

            {/* Bottom stats row */}
            <View style={styles.statsRow}>
              {course.loaded ? (
                <>
                  <View style={[styles.statPill, { borderColor: `${accentColor}30`, backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.statText, { color: accentColor }]}>
                      {course.topicCount} TOPICS
                    </Text>
                  </View>
                  {course.paperCount > 0 && (
                    <View style={[styles.statPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>{course.paperCount} PAPERS</Text>
                    </View>
                  )}
                  {/* Signal dot */}
                  <View style={[styles.signalDot, { backgroundColor: accentColor }]} />
                  <Text style={[styles.signalLabel, { color: accentColor }]}>
                    {course.signal}
                  </Text>
                </>
              ) : (
                <View style={styles.loadingRow}>
                  <View style={[styles.shimmer, { backgroundColor: colors.surfaceSecondary }]} />
                  <View style={[styles.shimmer, { width: 48, backgroundColor: colors.surfaceSecondary }]} />
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────
export default function PriorityIndexScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const [courses, setCourses] = useState<CourseMeta[]>(
    COURSE_MANIFEST.map(c => ({
      ...c,
      signal: 'SKIP' as CourseSignal,
      topicCount: 0,
      paperCount: 0,
      loaded: false,
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const showSearch = COURSE_MANIFEST.length > 8;

  // Fetch metadata for each course in parallel
  const loadCourseMeta = useCallback(async () => {
    await Promise.all(
      COURSE_MANIFEST.map(async (course, idx) => {
        try {
          const res = await fetch(`${API_URL}/topics/${course.code}`);
          if (!res.ok) return;
          const data = await res.json();
          const signal = deriveSignal(data.nodes ?? []);
          setCourses(prev => {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              signal,
              topicCount: (data.nodes ?? []).length,
              paperCount: data.paper_count ?? 0,
              loaded: true,
            };
            return next;
          });
        } catch {
          // degrade gracefully — card still shows, just no stats
          setCourses(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], loaded: true };
            return next;
          });
        }
      })
    );
  }, []);

  useEffect(() => { loadCourseMeta(); }, [loadCourseMeta]);

  const filtered = searchQuery
    ? courses.filter(
        c =>
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  // Sort: HIGH first, then MEDIUM, then SKIP
  const sorted = [...filtered].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, SKIP: 2 };
    return order[a.signal] - order[b.signal];
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background }, { shadowColor: colors.shadow }]}>
        <Activity size={22} color={colors.accent} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>PRIORITY MAP</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>SELECT COURSE OBJECTIVE</Text>
        </View>
        <View style={styles.headerIconRight}>
          <Map size={20} color={colors.textSecondary} />
        </View>
      </View>

      {/* ── Mission Status Banner ── */}
      <LinearGradient
        colors={scheme === 'dark' ? ['rgba(13,148,136,0.08)', 'transparent'] : [`${colors.accent}15`, 'transparent']}
        style={[styles.statusBanner, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.statusText, { color: colors.accent }]}>
          {courses.filter(c => c.loaded && c.signal === 'HIGH').length} HIGH-PRIORITY ZONES DETECTED
        </Text>
      </LinearGradient>

      {/* ── Optional search ── */}
      {showSearch && (
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface }, { shadowColor: colors.shadow }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Filter courses..."
              placeholderTextColor={`${colors.textSecondary}60`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* ── Course list ── */}
      <FlatList
        data={sorted}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <CourseCard
            course={item}
            index={index}
            onPress={() => router.push(`/priority/${item.code}`)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {courses.filter(c => c.loaded).length}/{courses.length} STATIONS ONLINE
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },

  // Header — matches map.tsx exactly
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#0c1322',
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
    ],
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: '#6bd8cb',
    fontSize: 18,
    fontFamily: Fonts?.primary ?? 'system',
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#879391',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  headerIconRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Status strip
  statusBanner: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,148,136,0.12)',
  },
  statusText: {
    color: '#6bd8cb',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
  },

  // Search
  searchRow: { paddingHorizontal: 24, paddingVertical: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141b2b',
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 46,
    gap: 10,
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.2)', inset: true },
    ],
  },
  searchInput: {
    flex: 1,
    color: '#dce2f7',
    fontSize: 14,
    fontFamily: Fonts?.body ?? 'system',
    padding: 0,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  separator: { height: 12 },

  // Card
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseInfo: { flex: 1, gap: 4 },
  courseCode: {
    color: '#6bd8cb',
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  courseName: {
    color: '#dce2f7',
    fontSize: 17,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    lineHeight: 22,
    paddingRight: 8,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61,73,71,0.15)',
    borderRadius: 10,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(61,73,71,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.25)',
  },
  statText: {
    color: '#879391',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  signalLabel: {
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },

  // Loading skeleton
  loadingRow: { flexDirection: 'row', gap: 8 },
  shimmer: {
    height: 20,
    width: 72,
    borderRadius: 10,
    backgroundColor: 'rgba(61,73,71,0.15)',
  },

  // Footer
  footer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#3d4947',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
  },
});
