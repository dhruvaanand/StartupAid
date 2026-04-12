import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Pressable, StyleSheet, Switch, Text, View, ScrollView } from 'react-native';
import { ChevronRight, Flame, LogOut, Bell, Moon, Clock, Palette as PaletteIcon, Settings } from 'lucide-react-native';

import { Fonts, Palette } from '@/constants/theme';
import { useHomeSupabase } from '@/hooks/use-home-supabase';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/context/theme-context';
import { API_URL } from '@/constants/api';

export default function ProfileScreen() {
  const { profileName, streakTarget, xp } = useHomeSupabase();
  const { signOut } = useAuth();
  const { scheme, toggleTheme } = useTheme();
  const colors = Palette[scheme];
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const level = Math.max(1, Math.floor((xp ?? 0) / 150));
  const focusHours = ((xp ?? 0) / 60).toFixed(1);
  const userInitial = profileName ? profileName.charAt(0).toUpperCase() : 'U';

  const handleNotificationToggle = async (val: boolean) => {
    setNotificationsEnabled(val);
    if (val) {
      // Demo nudge as requested
      try {
        await fetch(`${API_URL}/social/nudge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: 'SYSTEM_TEJA', // Mock sender
            receiver_id: 'ME', 
            type: 'wave',
            session_id: 'DEMO'
          })
        });
      } catch (e) { /* silent */ }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.shell}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>Profile</Text>

        {/* ── PROFILE HEADER ── */}
        <View style={styles.profileHeader}>
          {/* Avatar + streak badge (bottom-RIGHT, matching Stitch) */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarOuter, { shadowColor: colors.shadow }]}>
              <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: `${colors.accent}40` }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>{userInitial}</Text>
              </View>
            </View>
            {/* Streak badge — bottom-right, fire icon + JetBrains Mono */}
            <View style={[styles.streakBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, { shadowColor: colors.shadow }]}>
              <Flame size={14} color={colors.error} fill={colors.error} />
              <View>
                <Text style={[styles.streakBadgeValue, { color: colors.text }]}>{streakTarget} DAY</Text>
                <Text style={[styles.streakBadgeLabel, { color: colors.text }]}>STREAK</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{profileName}</Text>
            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>Gommies Student</Text>
            <View style={[styles.rankPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.rankPillText, { color: colors.accent }]}>SENIOR FOCUS RANK</Text>
            </View>
          </View>
        </View>

        {/* ── STATS ROW — label ABOVE value (Stitch order) ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            {/* Label above value — matching Stitch */}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>FOCUS</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{focusHours}h</Text>
            <Text style={[styles.statDelta, { color: colors.success }]}>+2.4h today</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EXPERIENCE</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{xp ?? 0}</Text>
            <Text style={[styles.statDelta, { color: colors.success }]}>LVL {level}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>WAVES</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>—</Text>
            <Text style={[styles.statDelta, { color: colors.textSecondary }]}>Sessions</Text>
          </View>
        </View>

        {/* ── PREFERENCES ── */}
        <View style={styles.prefSection}>
          <View style={styles.prefHeader}>
            <Text style={[styles.prefTitle, { color: colors.textSecondary }]}>YOUR PREFERENCES</Text>
            <Text style={[styles.prefSubtitle, { color: colors.textSecondary }]}>Optimize your focus environment</Text>
          </View>

          <View style={styles.settingsList}>
            <SettingRow
              icon={<Bell size={18} color={colors.accent} />}
              label="Notifications"
              hint="System alerts & updates"
              control={
                <Switch
                  value={notificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.textSecondary}
                  onValueChange={handleNotificationToggle}
                />
              }
            />
            <SettingRow
              icon={<Moon size={18} color={colors.accent} />}
              label="Nocturnal Mode"
              hint="Deep space contrast UI"
              control={
                <Switch
                  value={scheme === 'dark'}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.textSecondary}
                  onValueChange={toggleTheme}
                />
              }
            />
            <SettingRow
              icon={<Clock size={18} color={colors.accent} />}
              label="Study Reminders"
              hint="Daily focus nudge"
              control={<ChevronRight size={20} color={colors.textSecondary} />}
              onPress={() => {}}
            />
            <SettingRow
              icon={<PaletteIcon size={18} color={colors.accent} />}
              label="Visual Themes"
              hint="Customize terminal colors"
              control={<ChevronRight size={20} color={colors.textSecondary} />}
              onPress={() => {}}
              last
            />
          </View>
        </View>

        {/* ── SIGN OUT ── */}
        <Pressable style={[styles.signOutBtn, { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}20` }]} onPress={() => void signOut()}>
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>SIGN OUT SYSTEM</Text>
        </Pressable>

        {/* ── BUILD INFO ── */}
        <Text style={[styles.buildText, { color: colors.textSecondary }]}>BUILD VERSION 1.0.4 · {scheme === 'dark' ? 'NOCTURNAL' : 'LIGHT'} EDITION</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  hint,
  control,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  control: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { scheme } = useTheme();
  const colors = Palette[scheme];
  const pressScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.98, useNativeDriver: true, speed: 100, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 100, bounciness: 0 }).start();
  };

  const inner = (
    <Animated.View style={[
      styles.settingRow,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
      onPress && { transform: [{ scale: pressScale }] },
    ]}>
      <View style={[styles.settingIconContainer, { backgroundColor: colors.surfaceSecondary, shadowColor: colors.shadow }]}>
        {icon}
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.settingHint, { color: colors.textSecondary }]}>{hint}</Text>
      </View>
      <View style={styles.settingControl}>{control}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  shell: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  // Neumorphic card helper
  neumorphicCard: {
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
    ],
  },

  screenTitle: {
    color: '#dce2f7',
    fontSize: 32,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginBottom: 32,
  },

  // Profile header
  profileHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 24, marginBottom: 32 },
  avatarWrap: { position: 'relative' },
  avatarOuter: {
    borderRadius: 99,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#141b2b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(107,216,203,0.1)',
  },
  avatarText: { color: '#6bd8cb', fontSize: 36, fontFamily: Fonts?.primary ?? 'system' },
  // Streak badge — BOTTOM-RIGHT (not bottom-left)
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#2e3545',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.2)',
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 8, color: 'rgba(0,0,0,0.4)' }],
  },
  streakBadgeValue: {
    color: '#dce2f7',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  streakBadgeLabel: {
    color: '#dce2f7',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  profileInfo: { flex: 1, gap: 4, paddingTop: 8 },
  profileName: {
    color: '#dce2f7',
    fontSize: 24,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  profileRole: { color: '#bcc9c6', fontSize: 13, fontFamily: Fonts?.label ?? 'system', letterSpacing: 0.5 },
  rankPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2e3545',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.1)',
  },
  rankPillText: {
    color: '#6bd8cb',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },

  // Stats — label ABOVE value
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  statBox: {
    flex: 1,
    backgroundColor: '#141b2b',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.05)',
  },
  // Label renders FIRST (above value) — matching Stitch structure
  statLabel: {
    color: '#bcc9c6',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#6bd8cb',
    fontSize: 20,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
    marginTop: 4,
  },
  statDelta: {
    color: '#4edea3',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
  },

  // Preferences
  prefSection: { gap: 24, marginBottom: 32 },
  prefHeader: { gap: 4 },
  prefTitle: {
    color: '#bcc9c6',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  prefSubtitle: { color: '#3d4947', fontSize: 13, fontFamily: Fonts?.body ?? 'system', marginTop: 2 },

  settingsList: { gap: 0 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61,73,71,0.3)',
    gap: 16,
  },
  // Circular neumorphic-inset icon container — MATCHING STITCH
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232a3a',
    alignItems: 'center',
    justifyContent: 'center',
    // Neumorphic inset
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.5)', inset: true },
    ],
  },
  settingText: { flex: 1, gap: 2 },
  settingLabel: { color: '#dce2f7', fontSize: 15, fontFamily: Fonts?.bodyMedium ?? 'system', fontWeight: '500' },
  settingHint: { color: '#bcc9c6', fontSize: 12, fontFamily: Fonts?.body ?? 'system' },
  settingControl: {},

  // Sign out — error styling
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)',
    backgroundColor: 'rgba(255,180,171,0.05)',
    marginBottom: 24,
  },
  signOutText: {
    color: '#ffb4ab',
    fontSize: 13,
    fontFamily: Fonts?.primary ?? 'system',
    letterSpacing: 2.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  buildText: {
    color: '#bcc9c6',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.4,
  },
});
