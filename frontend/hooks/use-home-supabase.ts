import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type LeaderboardRow = {
  userId: string;
  name: string;
  xp: number;
};

export type CircleMemberRow = {
  id: string;
  name: string;
  status: 'online' | 'focus';
  studying: string;
  minutes: string;
};

const FIXED_USER_ID = 'a0000001-0000-0000-0000-000000000001';
const FIXED_WEEK_START = '2026-04-06';
const FIXED_CIRCLE_ID = 'b0000002-0000-0000-0000-000000000002';
const FIXED_COURSE_CODE = 'CS1.201';

export function useHomeSupabase() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default render values before first successful fetch.
  const [profileName, setProfileName] = useState('Pudie');
  const [userId, setUserId] = useState<string | null>(FIXED_USER_ID);

  const [streakTarget, setStreakTarget] = useState(7);
  const [xp, setXp] = useState(280);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(60);
  const [dailyGoalCurrent, setDailyGoalCurrent] = useState(45);
  const [freezeActive, setFreezeActive] = useState(true);
  const [todaysTopic, setTodaysTopic] = useState('CPU Scheduling');

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([
    { userId: 'tejas', name: 'Tejas', xp: 320 },
    { userId: 'pudie', name: 'Pudie', xp: 280 },
    { userId: 'atharva', name: 'Atharva', xp: 190 },
  ]);
  const [circleMembers, setCircleMembers] = useState<CircleMemberRow[]>([
    { id: 'm1', name: 'Alex', status: 'online', studying: 'CPU Scheduling', minutes: '23 min' },
    { id: 'm2', name: 'Sam', status: 'focus', studying: 'Switched to Instagram ⚠️', minutes: '' },
    { id: 'm3', name: 'Jordan', status: 'online', studying: 'Deadlock', minutes: '8 min' },
  ]);

  const streakRef = useRef(streakTarget);
  const xpRef = useRef(xp);
  const dailyTargetRef = useRef(dailyGoalTarget);
  const dailyCurrentRef = useRef(dailyGoalCurrent);
  const freezeRef = useRef(freezeActive);
  const leaderboardRef = useRef(leaderboard);
  const circleMembersRef = useRef(circleMembers);

  useEffect(() => {
    streakRef.current = streakTarget;
  }, [streakTarget]);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);
  useEffect(() => {
    dailyTargetRef.current = dailyGoalTarget;
  }, [dailyGoalTarget]);
  useEffect(() => {
    dailyCurrentRef.current = dailyGoalCurrent;
  }, [dailyGoalCurrent]);
  useEffect(() => {
    freezeRef.current = freezeActive;
  }, [freezeActive]);
  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);
  useEffect(() => {
    circleMembersRef.current = circleMembers;
  }, [circleMembers]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUserId(FIXED_USER_ID);

      // 1) user_state where user_id = fixed id
      const { data: userState, error: userStateErr } = await supabase
        .from('user_state')
        .select('streak, xp_total, daily_goal_target, daily_goal_current, freeze_active')
        .eq('user_id', FIXED_USER_ID)
        .single();

      if (userStateErr) throw userStateErr;
      if (userState) {
        setStreakTarget(typeof userState.streak === 'number' ? userState.streak : 7);
        setXp(typeof userState.xp_total === 'number' ? userState.xp_total : 280);
        setDailyGoalTarget(
          typeof userState.daily_goal_target === 'number' ? userState.daily_goal_target : 60,
        );
        setDailyGoalCurrent(
          typeof userState.daily_goal_current === 'number' ? userState.daily_goal_current : 45,
        );
        setFreezeActive(Boolean(userState.freeze_active));
      }

      // 2) weekly_xp where user_id + week_start fixed
      const { error: weeklyUserErr } = await supabase
        .from('weekly_xp')
        .select('user_id, week_start, xp_week')
        .eq('user_id', FIXED_USER_ID)
        .eq('week_start', FIXED_WEEK_START)
        .single();
      if (weeklyUserErr) throw weeklyUserErr;

      // 3) study_sessions by circle + active, joined with users
      const { data: sessionsRows, error: sessionsErr } = await supabase
        .from('study_sessions')
        .select('id, is_active, started_at, current_topic, users(name)')
        .eq('circle_id', FIXED_CIRCLE_ID)
        .eq('is_active', true);
      if (sessionsErr) throw sessionsErr;

      setCircleMembers(
        (sessionsRows ?? []).map((row: any, idx: number) => ({
          id: row.id ?? `session-${idx}`,
          name: row.users?.name ?? 'User',
          status: 'online',
          studying: row.current_topic ?? 'Focus session',
          minutes:
            row.started_at
              ? `${Math.floor((Date.now() - new Date(row.started_at).getTime()) / 60000)} min`
              : '',
        })),
      );

      // 4) topics top by exam_frequency_score
      const { data: topicRow, error: topicErr } = await supabase
        .from('topics')
        .select('name')
        .eq('course_code', FIXED_COURSE_CODE)
        .order('exam_frequency_score', { ascending: false })
        .limit(1)
        .single();
      if (topicErr) throw topicErr;
      setTodaysTopic(topicRow?.name ?? 'CPU Scheduling');

      // Leaderboard: weekly_xp joined with users by week_start, ordered desc.
      const { data: leaderboardRows, error: leaderboardErr } = await supabase
        .from('weekly_xp')
        .select('user_id, xp_week, users(name)')
        .eq('week_start', FIXED_WEEK_START)
        .order('xp_week', { ascending: false })
        .limit(3);
      if (leaderboardErr) throw leaderboardErr;

      if (Array.isArray(leaderboardRows) && leaderboardRows.length > 0) {
        setLeaderboard(
          leaderboardRows.map((r: any) => ({
            userId: r.user_id as string,
            name: r.users?.name ?? 'User',
            xp: typeof r.xp_week === 'number' ? r.xp_week : 0,
          })),
        );
      }

      // Profile name from users table
      const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', FIXED_USER_ID)
        .single();
      if (userRow?.name) setProfileName(userRow.name);
    } catch {
      setError('Failed to load live data from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeFocusSession = useCallback(
    async (params: { durationMinutes: number; xpDelta: number }) => {
      try {
        if (!userId) return;

        const nextDaily = Math.min(
          dailyTargetRef.current,
          dailyCurrentRef.current + params.durationMinutes,
        );
        const crossedGoal = dailyCurrentRef.current < dailyTargetRef.current && nextDaily >= dailyTargetRef.current;
        const nextStreak = crossedGoal ? streakRef.current + 1 : streakRef.current;

        const nextXp = xpRef.current + params.xpDelta;

        // Update user_state
        await supabase.from('user_state').upsert(
          {
            user_id: userId,
            streak: nextStreak,
            xp_total: nextXp,
            daily_goal_target: dailyTargetRef.current,
            daily_goal_current: nextDaily,
            freeze_active: freezeRef.current,
          },
          { onConflict: 'user_id' },
        );

        // Update weekly_xp
        const { data: existingWeekly } = await supabase
          .from('weekly_xp')
          .select('xp_week')
          .eq('user_id', userId)
          .eq('week_start', FIXED_WEEK_START)
          .single();

        const existingXpWeek = existingWeekly ? (existingWeekly as any).xp_week : 0;
        const nextXpWeek = (typeof existingXpWeek === 'number' ? existingXpWeek : 0) + params.xpDelta;

        await supabase.from('weekly_xp').upsert(
          {
            user_id: userId,
            week_start: FIXED_WEEK_START,
            xp_week: nextXpWeek,
          },
          { onConflict: 'user_id,week_start' },
        );

        await refresh();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[useHomeSupabase] completeFocusSession failed', e);
      }
    },
    [refresh, userId],
  );

  const dailyPercent = useMemo(() => {
    if (dailyGoalTarget <= 0) return 0;
    return Math.round((dailyGoalCurrent / dailyGoalTarget) * 100);
  }, [dailyGoalCurrent, dailyGoalTarget]);

  return {
    loading,
    error,
    userId,
    profileName,
    streakTarget,
    xp,
    dailyGoalTarget,
    dailyGoalCurrent,
    dailyPercent,
    freezeActive,
    leaderboard,
    circleMembers,
    todaysTopic,
    refresh,
    completeFocusSession,
  };
}

