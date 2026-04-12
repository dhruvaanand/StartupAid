import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
  ActivityIndicator, ScrollView, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle, Flame, Lightbulb, ArrowRight, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#6bd8cb', '#FB923C', '#dce2f7', '#0D9488', '#879391'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

type Question = {
  id: string;
  topic_name: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

// ── Confetti ──────────────────────────────────────────────────────────────────
function SimpleConfetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * SCREEN_WIDTH * 1.4,
      dy: -(SCREEN_HEIGHT * (0.4 + Math.random() * 0.5)),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 9,
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    })), []);

  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (active) {
      anims.forEach(a => a.setValue(0));
      Animated.stagger(12, anims.map(a =>
        Animated.timing(a, { toValue: 1, duration: 1600, useNativeDriver: true })
      )).start();
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const anim = anims[i];
        const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] });
        const opacity    = anim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] });
        const rotate     = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] });
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              bottom: SCREEN_HEIGHT * 0.2,
              left: SCREEN_WIDTH / 2 - p.size / 2,
              width: p.size, height: p.size,
              borderRadius: p.size / 4,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

// ── Transient Banner ──────────────────────────────────────────────────────────
function FadeBanner({
  visible, children, style,
}: {
  visible: boolean; children: React.ReactNode; style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  return (
    <Animated.View style={[{ opacity }, style]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
type OptionState = 'idle' | 'correct' | 'wrong' | 'reveal';

function OptionCard({
  label, text, state, onPress,
}: {
  label: string; text: string; state: OptionState; onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => { if (state !== 'idle') return; Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 100, bounciness: 0 }).start(); };
  const onOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 100, bounciness: 0 }).start(); };

  const borderColor = { 
    idle: colors.border, 
    correct: colors.success, 
    wrong: colors.error, 
    reveal: colors.success 
  }[state];
  
  const bg = { 
    idle: colors.surface, 
    correct: colors.successSecondary, 
    wrong: colors.errorSecondary, 
    reveal: colors.successSecondary 
  }[state];

  const labelBg = { 
    idle: colors.surfaceSecondary, 
    correct: colors.successSecondary, 
    wrong: colors.errorSecondary, 
    reveal: colors.successSecondary 
  }[state];

  const labelColor = { 
    idle: colors.textSecondary, 
    correct: colors.success, 
    wrong: colors.error, 
    reveal: colors.success 
  }[state];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={state === 'idle' ? onPress : undefined}
        onPressIn={onIn}
        onPressOut={onOut}
        style={[styles.optionCard, { backgroundColor: bg, borderColor, shadowColor: colors.shadow }]}
      >
        <View style={[styles.optionBadge, { backgroundColor: labelBg }]}>
          <Text style={[styles.optionBadgeText, { color: labelColor }]}>{label}</Text>
        </View>
        <Text style={[styles.optionText, { color: state === 'idle' ? colors.textSecondary : colors.text }]} numberOfLines={4}>
          {text}
        </Text>
        {state === 'correct' && <CheckCircle2 size={18} color={colors.success} />}
        {state === 'wrong'   && <XCircle      size={18} color={colors.error} />}
      </Pressable>
    </Animated.View>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  score, total, onRetry,
}: {
  score: number; total: number; onRetry: () => void;
}) {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const pct = total > 0 ? score / total : 0;

  const isPerfect = pct === 1;
  const isGood    = pct > 0.8;
  const isPoor    = pct < 0.4;

  const mascot = isPerfect || isGood
    ? require('@/brand_assets/happy_bear.png')
    : isPoor
    ? require('@/brand_assets/sad_bear.png')
    : require('@/brand_assets/waving_bear.png');

  const quote = isPerfect
    ? '"Perfect score. The algorithm bows to you."'
    : isGood
    ? '"Knew you had it."'
    : isPoor
    ? '"We need to talk about this one."'
    : '"Not bad — but there\'s room to level up."';

  const accentColor = isPerfect || isGood ? colors.success : isPoor ? colors.error : colors.accent;

  return (
    <View style={[styles.results, { backgroundColor: colors.background }]}>
      {isPerfect && <SimpleConfetti active />}

      <Image source={mascot} style={styles.mascot} resizeMode="contain" />

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color: accentColor }]}>
          {score}/{total}
        </Text>
        {isPerfect && <Trophy size={48} color={accentColor} style={{ marginLeft: 16 }} />}
      </View>
      <Text style={[styles.scorePct, { color: colors.textSecondary }]}>{Math.round(pct * 100)}%</Text>

      <View style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: `${accentColor}30`, shadowColor: colors.shadow }]}>
        <Text style={[styles.quoteText, { color: accentColor }]}>{quote}</Text>
      </View>

      {/* Accuracy bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: accentColor }]} />
      </View>

      <View style={styles.resultsActions}>
        <Pressable onPress={onRetry} style={[styles.retryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.retryBtnText, { color: colors.accent }]}>RETRY</Text>
        </Pressable>
        <Pressable
          onPress={() => router.navigate('/(tabs)/map' as any)}
          style={{ flex: 1 }}>
          <LinearGradient colors={scheme === 'dark' ? ['#13b5a7', '#077169'] : ['#0d9488', '#0f766e']} style={styles.mapBtn}>
            <Text style={styles.mapBtnText}>BACK TO MAP</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [qIdx,      setQIdx]      = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [score,     setScore]     = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [phase,     setPhase]     = useState<'quiz' | 'results'>('quiz');

  // Easter egg flags
  const [showFire,     setShowFire]     = useState(false);
  const [showEinstein, setShowEinstein] = useState(false);
  const fireShownAt = useRef(-1); // streak value at which fire was last shown

  // Progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch ───────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/quiz/practice/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const qs: Question[] = data.questions ?? [];
      setQuestions(qs);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleRetry = useCallback(() => {
    setQIdx(0); setSelected(null); setScore(0); setStreak(0);
    setPhase('quiz'); setShowFire(false); setShowEinstein(false);
    fireShownAt.current = -1;
    fetchQuestions();
  }, [fetchQuestions]);

  // Update progress bar
  useEffect(() => {
    if (!questions.length) return;
    const target = (qIdx + (selected !== null ? 1 : 0)) / questions.length;
    Animated.timing(progressAnim, {
      toValue: target, duration: 300, useNativeDriver: false,
    }).start();
  }, [qIdx, selected, questions.length]);

  // ── Answer handler ──────────────────────────────────────
  const handleSelect = useCallback((idx: number) => {
    if (selected !== null || !questions.length) return;
    setSelected(idx);

    const q = questions[qIdx];
    const isCorrect = idx === q.correct_index;

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => {
        const ns = s + 1;
        if (ns % 3 === 0 && ns !== fireShownAt.current) {
          fireShownAt.current = ns;
          setShowFire(true);
          setTimeout(() => setShowFire(false), 2600);
        }
        return ns;
      });
    } else {
      setStreak(0);
      if (qIdx === 0) {
        setShowEinstein(true);
        setTimeout(() => setShowEinstein(false), 4000);
      }
    }
  }, [selected, questions, qIdx]);

  // ── Next handler ────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (qIdx + 1 >= questions.length) {
      setPhase('results');
    } else {
      setQIdx(i => i + 1);
      setSelected(null);
    }
  }, [qIdx, questions.length]);

  // ── Render helpers ──────────────────────────────────────
  const getOptionState = (i: number): OptionState => {
    if (selected === null) return 'idle';
    const q = questions[qIdx];
    if (i === q.correct_index) return selected === i ? 'correct' : 'reveal';
    if (i === selected)         return 'wrong';
    return 'idle';
  };

  // ── Loading / Error / Empty ─────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.accent }]}>LOADING QUESTIONS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>No Quiz Available</Text>
          <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error ?? 'No questions found for this course.'}</Text>
          <Pressable style={[styles.smallRetryBtn, { backgroundColor: colors.accent }]} onPress={handleRetry}>
            <Text style={[styles.smallRetryBtnText, { color: scheme === 'light' ? '#fff' : '#003732' }]}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'results') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ResultsScreen score={score} total={questions.length} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  const q = questions[qIdx];
  const isAnswered = selected !== null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Easter egg overlays */}
      <FadeBanner visible={showFire} style={[styles.fireBanner, { backgroundColor: colors.errorSecondary, borderColor: colors.error }]}>
        <Flame size={18} color={colors.error} />
        <Text style={[styles.fireBannerText, { color: colors.error }]}>ON FIRE</Text>
      </FadeBanner>

      <FadeBanner visible={showEinstein} style={[styles.einsteinTooltip, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <View style={styles.einsteinRow}>
          <Lightbulb size={18} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.einsteinText, { color: colors.textSecondary }]}>
            It's okay, even Einstein failed his entrance exam
          </Text>
        </View>
      </FadeBanner>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.accent} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={[styles.headerCourse, { color: colors.accent }]}>{id}</Text>
          <Text style={[styles.headerProg, { color: colors.textSecondary }]}>
            {qIdx + 1} / {questions.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accent,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Topic badge */}
        <View style={[styles.topicBadge, { backgroundColor: colors.accentSecondary, borderColor: colors.border }]}>
          <Text style={[styles.topicBadgeText, { color: colors.accent }]}>{q.topic_name.toUpperCase()}</Text>
        </View>

        {/* Question */}
        <Text style={[styles.qNum, { color: colors.textSecondary }]}>Q{String(qIdx + 1).padStart(2, '0')}</Text>
        <Text style={[styles.qText, { color: colors.text }]}>{q.question}</Text>

        {/* Options */}
        <View style={styles.options}>
          {q.options.map((opt, i) => (
            <OptionCard
              key={i}
              label={OPTION_LABELS[i]}
              text={opt}
              state={getOptionState(i)}
              onPress={() => handleSelect(i)}
            />
          ))}
        </View>

        {/* Explanation */}
        {isAnswered && q.explanation ? (
          <View style={[styles.explanationCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.explanationLabel, { color: colors.accent }]}>EXPLANATION</Text>
            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{q.explanation}</Text>
          </View>
        ) : null}

        {/* Next / Results button */}
        {isAnswered && (
          <Pressable onPress={handleNext} style={styles.nextBtn}>
            <LinearGradient colors={scheme === 'dark' ? ['#13b5a7', '#077169'] : ['#0d9488', '#0f766e']} style={styles.nextBtnGrad}>
              <View style={styles.nextBtnLabelRow}>
                <Text style={styles.nextBtnText}>
                  {qIdx + 1 >= questions.length ? 'SEE RESULTS' : 'NEXT'}
                </Text>
                <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />
              </View>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61,73,71,0.15)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  headerCourse: {
    color: '#6bd8cb',
    fontSize: 14,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  headerProg: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts?.mono ?? 'system',
    marginTop: 2,
    letterSpacing: 1,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(61,73,71,0.3)',
    marginHorizontal: 0,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#6bd8cb',
    borderRadius: 2,
  },

  // Scroll content
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },

  // Topic badge
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(107,216,203,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(107,216,203,0.2)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  topicBadgeText: {
    color: '#6bd8cb',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
  },

  // Question
  qNum: {
    color: '#3d4947',
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    marginBottom: 10,
  },
  qText: {
    color: '#dce2f7',
    fontSize: 20,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: 32,
  },

  // Options
  options: { gap: 12, marginBottom: 20 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    boxShadow: [
      { offsetX: -3, offsetY: -3, blurRadius: 8, color: 'rgba(27,37,55,0.4)' },
      { offsetX: 3,  offsetY: 3,  blurRadius: 8, color: '#080c14' },
    ],
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionBadgeText: {
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    color: '#879391',
    fontSize: 15,
    fontFamily: Fonts?.body ?? 'system',
    lineHeight: 22,
  },

  // Explanation
  explanationCard: {
    backgroundColor: 'rgba(107,216,203,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(107,216,203,0.15)',
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    marginBottom: 20,
  },
  explanationLabel: {
    color: '#6bd8cb',
    fontSize: 9,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    marginBottom: 8,
  },
  explanationText: {
    color: '#bcc9c6',
    fontSize: 14,
    fontFamily: Fonts?.body ?? 'system',
    lineHeight: 22,
  },

  // Next button
  nextBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  nextBtnGrad: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: 'white',
    fontSize: 13,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2,
    fontWeight: 'bold',
  },

  // Fire banner
  fireBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
  },
  fireBannerText: {
    color: '#FB923C',
    fontSize: 14,
    fontFamily: Fonts?.mono ?? 'system',
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Einstein tooltip
  einsteinTooltip: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(20,27,43,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.4)',
    borderRadius: 16,
    padding: 16,
  },
  einsteinText: {
    color: '#879391',
    fontSize: 13,
    fontFamily: Fonts?.body ?? 'system',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Loading / Error
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  loadingText: {
    color: '#6bd8cb', fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system', letterSpacing: 2,
  },
  errorTitle: {
    color: '#dce2f7', fontSize: 20, fontWeight: 'bold',
    fontFamily: Fonts?.primary ?? 'system',
  },
  errorBody: { color: '#879391', textAlign: 'center', fontSize: 14 },
  smallRetryBtn: {
    backgroundColor: '#6bd8cb',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999,
  },
  smallRetryBtnText: { color: '#003732', fontWeight: 'bold', letterSpacing: 1 },

  // Results screen
  results: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mascot: { width: 140, height: 140, marginBottom: 24 },
  scoreValue: {
    fontSize: 64,
    fontFamily: Fonts?.primary ?? 'system',
    fontWeight: 'bold',
  },
  scorePct: {
    color: '#879391', fontSize: 18,
    fontFamily: Fonts?.mono ?? 'system',
    marginBottom: 28,
    letterSpacing: 2,
  },
  quoteCard: {
    backgroundColor: '#141b2b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    boxShadow: [
      { offsetX: -3, offsetY: -3, blurRadius: 10, color: 'rgba(27,37,55,0.4)' },
      { offsetX: 3,  offsetY: 3,  blurRadius: 10, color: '#080c14' },
    ],
  },
  quoteText: {
    fontSize: 16, fontStyle: 'italic',
    fontFamily: Fonts?.body ?? 'system',
    textAlign: 'center', lineHeight: 24,
  },
  barTrack: {
    width: '100%', height: 6,
    borderRadius: 999, marginBottom: 32, overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 999 },
  resultsActions: {
    flexDirection: 'row', gap: 12, width: '100%',
  },
  retryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  retryBtnText: {
    fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2, fontWeight: 'bold',
  },
  mapBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  mapBtnText: {
    color: 'white', fontSize: 12,
    fontFamily: Fonts?.mono ?? 'system',
    letterSpacing: 2, fontWeight: 'bold',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  einsteinRow: { flexDirection: 'row', alignItems: 'center' },
  nextBtnLabelRow: { flexDirection: 'row', alignItems: 'center' },
});
