import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const CAMPUSES = ['MIT', 'Stanford', 'Berkeley', 'Georgia Tech', 'Waterloo'];
const COURSES = ['OS & CPU Scheduling', 'Distributed Systems', 'Databases', 'Algorithms', 'Networks'];

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const [campus, setCampus] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCourse = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course],
    );
  };

  const onContinue = async () => {
    if (!campus || selectedCourses.length === 0) {
      Alert.alert('Almost there', 'Pick your campus and at least one course.');
      return;
    }

    try {
      setSaving(true);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        router.replace('/(tabs)');
        return;
      }

      const userId = userData.user.id;

      await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          campus,
          courses: selectedCourses,
        },
        { onConflict: 'user_id' },
      );
    } catch {
    } finally {
      setSaving(false);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <Text style={styles.stepLabel}>Step 2 of 2</Text>
        <Text style={styles.title}>Set up your campus</Text>
        <Text style={styles.subtitle}>
          Circles and priority maps will adapt to your campus and courses.
        </Text>

        <Text style={styles.sectionTitle}>Campus</Text>
        <View style={styles.pillRow}>
          {CAMPUSES.map((c) => {
            const active = campus === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCampus(c)}
                style={[styles.pill, active && styles.pillActive]}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>This semester&apos;s courses</Text>
        <FlatList
          data={COURSES}
          keyExtractor={(item) => item}
          style={styles.courseList}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => {
            const active = selectedCourses.includes(item);
            return (
              <Pressable
                onPress={() => toggleCourse(item)}
                style={[styles.courseCard, active && styles.courseCardActive]}>
                <View style={styles.courseCardLeft}>
                  <MaterialIcons
                    name={active ? 'check-circle' : 'radio-button-unchecked'}
                    size={22}
                    color={active ? '#0D9488' : '#64748B'}
                  />
                  <Text style={[styles.courseName, active && styles.courseNameActive]}>{item}</Text>
                </View>
                <Text style={styles.courseMeta}>Circle + priority map</Text>
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={saving ? undefined : onContinue}
          style={[styles.primaryCtaBtn, saving && styles.primaryCtaBtnDisabled]}>
          <Text style={styles.primaryCtaText}>{saving ? 'Saving…' : 'Continue to Gommies'}</Text>
        </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  stepLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginTop: 6,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    borderColor: '#0D9488',
    backgroundColor: '#0F172A',
  },
  pillText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  pillTextActive: {
    color: '#0D9488',
  },
  courseList: {
    flexGrow: 0,
    marginTop: 4,
    maxHeight: 260,
  },
  courseCard: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseCardActive: {
    borderColor: '#0D9488',
    backgroundColor: '#0F172A',
  },
  courseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courseName: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  courseNameActive: {
    color: '#0D9488',
  },
  courseMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  primaryCtaBtn: {
    marginTop: 'auto',
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryCtaBtnDisabled: {
    opacity: 0.7,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
});

