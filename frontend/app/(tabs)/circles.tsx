import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type CircleRow = {
  id: string;
  course: string;
  courseCode: string;
  activeCount: number;
};

export default function CirclesScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circles, setCircles] = useState<CircleRow[]>([]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Circles where user is a member.
        const { data: memberRows, error: memberErr } = await supabase
          .from('circle_members')
          .select('circle_id, circles(id, name, course_code)')
          .eq('user_id', 'a0000001-0000-0000-0000-000000000001');
        if (memberErr) throw memberErr;

        const parsedCircles: CircleRow[] = (memberRows ?? [])
          .map((row: any) => ({
            id: row.circles?.id ?? row.circle_id,
            course: row.circles?.name ?? 'Untitled Circle',
            courseCode: row.circles?.course_code ?? 'N/A',
            activeCount: 0,
          }))
          .filter((c) => Boolean(c.id));

        if (parsedCircles.length === 0) {
          setCircles([]);
          setLoading(false);
          return;
        }

        // 2) Count active members by circle_id.
        const circleIds = parsedCircles.map((c) => c.id);
        const { data: activeRows, error: activeErr } = await supabase
          .from('study_sessions')
          .select('circle_id')
          .eq('is_active', true)
          .in('circle_id', circleIds);
        if (activeErr) throw activeErr;

        const countByCircle = new Map<string, number>();
        (activeRows ?? []).forEach((r: any) => {
          const key = r.circle_id as string;
          countByCircle.set(key, (countByCircle.get(key) ?? 0) + 1);
        });

        setCircles(
          parsedCircles.map((c) => ({
            ...c,
            activeCount: countByCircle.get(c.id) ?? 0,
          })),
        );
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load circles');
      } finally {
        setLoading(false);
      }
    };

    void fetchCircles();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <Text style={styles.title}>Your Circles</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.centerText}>Loading circles…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Couldn&apos;t load circles</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : circles.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerText}>No circles found yet.</Text>
          </View>
        ) : (
          <FlatList
            data={circles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 14, gap: 10 }}
            renderItem={({ item }) => {
              const active = item.activeCount > 0;
              return (
                <Pressable
                  style={styles.card}
                  onPress={() => router.push(`/circle/${item.id}`)}>
                  <View style={styles.cardLeft}>
                    <View style={styles.courseIcon}>
                      <MaterialIcons name="groups" size={22} color="#0D9488" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseName}>{item.course}</Text>
                      <Text style={styles.courseCode}>{item.courseCode}</Text>
                      <View style={styles.activeRow}>
                        {active && (
                          <Animated.View style={[styles.pulseDot, { opacity: pulse }]} />
                        )}
                        <Text style={styles.activeCountText}>{item.activeCount} active members</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <View style={[styles.statusPill, active ? styles.statusPillActive : styles.statusPillIdle]}>
                      <Text style={[styles.statusPillText, active ? styles.statusPillTextActive : styles.statusPillTextIdle]}>
                        {active ? `${item.activeCount} active now` : 'No one studying'}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#64748B" />
                  </View>
                </Pressable>
              );
            }}
          />
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
    paddingTop: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Fonts.primary,
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
    textAlign: 'center',
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
  card: {
    backgroundColor: '#1A2E2E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#022C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.secondaryBold,
  },
  courseCode: {
    color: '#99F6E4',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginTop: 2,
  },
  activeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22C55E',
  },
  activeCountText: {
    color: '#CFFAFE',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#FB923C',
  },
  statusPillIdle: {
    backgroundColor: '#374151',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  statusPillTextIdle: {
    color: '#E5E7EB',
  },
});

