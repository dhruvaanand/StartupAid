import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export type LeaderboardRow = {
  userId: string;
  name: string;
  xp: number;
};

export type CircleMemberRow = {
  id: string; // user_id
  session_id?: string; // active session id
  name: string;
  status: 'online' | 'focus';
  studying: string;
  minutes: string;
};

const FIXED_CIRCLE_ID = 'b0000002-0000-0000-0000-000000000002';
const FIXED_COURSE_CODE = 'CS1.201';
// In dev, usually 10.0.2.2 for Android emulator or localhost for iOS/Web
import { API_URL } from '@/constants/api';

export function useHomeSupabase() {
  const { session, user } = useAuth();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState('...');
  const [streakTarget, setStreakTarget] = useState(0);
  const [xp, setXp] = useState(0);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(60);
  const [dailyGoalCurrent, setDailyGoalCurrent] = useState(0);
  const [freezeActive, setFreezeActive] = useState(false);
  const [todaysTopic, setTodaysTopic] = useState('');

  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [circleMembers, setCircleMembers] = useState<CircleMemberRow[]>([]);

  const streakRef = useRef(streakTarget);
  const xpRef = useRef(xp);
  const dailyTargetRef = useRef(dailyGoalTarget);
  const dailyCurrentRef = useRef(dailyGoalCurrent);
  const freezeRef = useRef(freezeActive);
  const leaderboardRef = useRef(leaderboard);
  const circleMembersRef = useRef(circleMembers);

  useEffect(() => { streakRef.current = streakTarget; }, [streakTarget]);
  useEffect(() => { xpRef.current = xp; }, [xp]);
  useEffect(() => { dailyTargetRef.current = dailyGoalTarget; }, [dailyGoalTarget]);
  useEffect(() => { dailyCurrentRef.current = dailyGoalCurrent; }, [dailyGoalCurrent]);
  useEffect(() => { freezeRef.current = freezeActive; }, [freezeActive]);
  useEffect(() => { leaderboardRef.current = leaderboard; }, [leaderboard]);
  useEffect(() => { circleMembersRef.current = circleMembers; }, [circleMembers]);

  const lastFetchTime = useRef(0);
  const isFirstLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId || userId === 'undefined') {
      console.warn('Refresh skipped: userId is', userId);
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;

    // Gommies Logic: Allow poll to pass if we're stuck in loading for too long (>15s)
    if (loading && timeSinceLastFetch < 15000 && !isFirstLoad.current) {
      console.log('>>> Refresh skipped: fetch already in progress');
      return;
    }

    if (loading && !isFirstLoad.current) {
      console.log("Still loading, but allowing poll to reset state...");
    }
    
    console.log('>>> Triggering refresh for userId:', userId);
    lastFetchTime.current = now;
    isFirstLoad.current = false;

    try {
      setLoading(true);
      setError(null);

      // Fetch user state
      const userRes = await fetch(`${API_URL}/user/${userId}`);
      if (!userRes.ok) {
        const errData = await userRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to fetch user');
      }
      const userData = await userRes.json();
      
      setProfileName(userData.name || 'User');
      setStreakTarget(userData.streak || 0);
      setXp(userData.xp_total || 0);
      setDailyGoalTarget(userData.daily_goal_target || 60);
      setDailyGoalCurrent(userData.daily_goal_current || 0);
      setFreezeActive(userData.freeze_active || false);

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${API_URL}/leaderboard/${FIXED_CIRCLE_ID}`);
      if (leaderboardRes.ok) {
        const lbData = await leaderboardRes.json();
        setLeaderboard(Array.isArray(lbData) ? lbData.map((r: any, idx) => ({
          userId: `u${idx}`,
          name: r.name,
          xp: r.xp_week
        })) : []);
      }

      // Fetch circle members
      const membersRes = await fetch(`${API_URL}/circle/${FIXED_CIRCLE_ID}/members`);
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setCircleMembers(Array.isArray(membersData) ? membersData.map((m: any) => ({
          id: m.user_id,
          session_id: m.session_id,
          name: m.name,
          status: m.is_active ? 'online' : 'focus',
          studying: m.current_topic,
          minutes: `${m.minutes} min`
        })) : []);
      }

      // Fetch today's topic
      const topicRes = await fetch(`${API_URL}/today-topic/${FIXED_COURSE_CODE}`);
      if (topicRes.ok) {
        const topicData = await topicRes.json();
        setTodaysTopic(topicData.name || 'CPU Scheduling');
      }

    } catch (err: any) {
      console.error('Home Fetch Error:', err);
      setError(err.message || 'Failed to load live data.');
      // Fallbacks...
      setLeaderboard([]);
      setCircleMembers([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }

    // Initial fetch once userId is confirmed
    console.log('🚀 Initializing data stream for:', userId);
    setLoading(true);
    refresh();

    // Set up 15s polling for demo stability
    const interval = setInterval(() => {
      console.log('🔄 Polling: Refreshing home data...');
      refresh();
    }, 15000);

    return () => clearInterval(interval);
  }, [userId, refresh]);

  const completeFocusSession = useCallback(
    async (params: { durationMinutes: number; xpDelta: number }) => {
      // NOTE: With the FastAPI backend, session ending logic should happen through `/session/end`.
      // The backend will update user state and XP automatically.
      // So this method expects a session id or relies purely on the Backend refresh.
      await refresh();
    },
    [refresh]
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
