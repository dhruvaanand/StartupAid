import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';
import { useHomeSupabase } from '@/hooks/use-home-supabase';

export default function ProfileScreen() {
  const { profileName, streakTarget, xp } = useHomeSupabase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{profileName}</Text>
            <Text style={styles.handle}>Gommies student</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={styles.levelValue}>{Math.max(1, Math.floor(xp / 150))}</Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <MaterialIcons name="local-fire-department" size={24} color="#FB923C" />
            <Text style={styles.streakValue}>{streakTarget} day streak</Text>
          </View>
          <Text style={styles.streakMeta}>
            Keep it alive with at least one focus session a day.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{xp}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Semester hours</Text>
            <Text style={styles.statValue}>12.4</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Topics covered</Text>
            <Text style={styles.statValue}>18</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingHint}>
              Session reminders, circle nudges, and streak alerts.
            </Text>
          </View>
          <Switch value thumbColor="#0D9488" onValueChange={() => {}} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Circle visibility</Text>
            <Text style={styles.settingHint}>Let your circles see when you&apos;re focusing.</Text>
          </View>
          <Switch value thumbColor="#0D9488" onValueChange={() => {}} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Courses this semester</Text>
            <Text style={styles.settingHint}>
              Update which courses should show circles + maps.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#64748B" />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Campus</Text>
            <Text style={styles.settingHint}>Change your campus to see different circles.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#64748B" />
        </View>

        <Pressable style={styles.signOutRow} onPress={() => {}}>
          <MaterialIcons name="logout" size={20} color="#F97316" />
          <Text style={styles.signOutText}>Sign out</Text>
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  handle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#022C22',
    alignItems: 'center',
  },
  levelLabel: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  levelValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  streakCard: {
    marginTop: 16,
    backgroundColor: '#020617',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  streakMeta: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
  },
  statValue: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  settingRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
  settingHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginTop: 2,
    maxWidth: 230,
  },
  signOutRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
});


