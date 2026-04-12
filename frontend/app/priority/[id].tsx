import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Path, Defs, Marker, Polygon, Text as SvgText } from 'react-native-svg';
import { ArrowLeft, Star, ChevronRight, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRIORITY_RADII = { HIGH: 20, MEDIUM: 15, SKIP: 11 } as const;
const PRIORITY_COLORS = { HIGH: '#0D9488', MEDIUM: '#FB923C', SKIP: '#888780' } as const;

type TopicNode = {
  id: string;
  label: string;
  priority: 'HIGH' | 'MEDIUM' | 'SKIP';
  exam_frequency: number;
  peer_difficulty: number;
  confidence: number;
};

type TopicEdge = { source: string; target: string };

type PriorityMapResponse = {
  course_code: string;
  nodes: TopicNode[];
  links: TopicEdge[];
  paper_count: number;
};

type LayoutNode = TopicNode & { x: number; y: number };

// -------------------------------------------------------------
// Antigravity Force-Directed Layout
// -------------------------------------------------------------
function computeAntigravityLayout(
  nodes: TopicNode[], 
  links: TopicEdge[], 
  graphW: number, 
  graphH: number
): LayoutNode[] {
  if (!nodes.length) return [];

  // 1. Initial positions (clamped random spread)
  const layout: LayoutNode[] = nodes.map((n) => ({
    ...n,
    x: graphW / 2 + (Math.random() - 0.5) * graphW * 0.3,
    y: graphH / 2 + (Math.random() - 0.5) * graphH * 0.3,
  }));

  const ITERATIONS = 150;
  const K_REPULSION = 8000;
  const K_ATTRACTION = 0.06;
  const K_CENTERING = 0.015;
  const IDEAL_LENGTH = 85;
  const FRICTION = 0.85;

  let velocities = nodes.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < ITERATIONS; i++) {
    const cool = 1 - i / ITERATIONS;
    let forces = nodes.map(() => ({ x: 0, y: 0 }));

    // A. Repulsion (Coulomb-style: 1/dist^2)
    for (let j = 0; j < layout.length; j++) {
      for (let k = j + 1; k < layout.length; k++) {
        const dx = layout[j].x - layout[k].x;
        const dy = layout[j].y - layout[k].y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);
        const f = (K_REPULSION / distSq) * cool;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        forces[j].x += fx;
        forces[j].y += fy;
        forces[k].x -= fx;
        forces[k].y -= fy;
      }
    }

    // B. Attraction (Spring-style)
    links.forEach(link => {
      const srcIdx = layout.findIndex(n => n.id === link.source);
      const tgtIdx = layout.findIndex(n => n.id === link.target);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const dx = layout[tgtIdx].x - layout[srcIdx].x;
      const dy = layout[tgtIdx].y - layout[srcIdx].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (dist - IDEAL_LENGTH) * K_ATTRACTION * cool;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      forces[srcIdx].x += fx;
      forces[srcIdx].y += fy;
      forces[tgtIdx].x -= fx;
      forces[tgtIdx].y -= fy;
    });

    // C. Centering
    layout.forEach((node, idx) => {
      forces[idx].x += (graphW / 2 - node.x) * K_CENTERING * cool;
      forces[idx].y += (graphH / 2 - node.y) * K_CENTERING * cool;
    });

    // D. Apply
    layout.forEach((node, idx) => {
      const v = velocities[idx];
      v.x = (v.x + forces[idx].x) * FRICTION;
      v.y = (v.y + forces[idx].y) * FRICTION;
      node.x += v.x;
      node.y += v.y;

      // E. Boundary Clamping
      const r = PRIORITY_RADII[node.priority] + 15;
      node.x = Math.max(r, Math.min(graphW - r, node.x));
      node.y = Math.max(r, Math.min(graphH - r, node.y));
    });
  }

  // Final safety check for NaN
  layout.forEach(node => {
    if (isNaN(node.x) || isNaN(node.y)) {
      node.x = graphW / 2;
      node.y = graphH / 2;
    }
  });

  return layout;
}

function edgePath(sx: number, sy: number, sr: number, tx: number, ty: number, tr: number): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Guard: nodes are effectively on top of each other — skip this edge entirely
  if (dist < 2) return '';

  const ux = dx / dist;
  const uy = dy / dist;

  const x1 = sx + ux * sr;
  const y1 = sy + uy * sr;
  const x2 = tx - ux * tr;
  const y2 = ty - uy * tr;

  // Guard: edge start overlaps end (radii fill the gap)
  const edgeLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (edgeLen < 1) return '';

  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export default function PriorityMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  const PRIORITY_RADII = { HIGH: 20, MEDIUM: 15, SKIP: 11 } as const;
  const PRIORITY_COLORS = { 
    HIGH: colors.success, 
    MEDIUM: colors.error, 
    SKIP: colors.textSecondary 
  } as const;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PriorityMapResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [graphDims, setGraphDims] = useState({ w: SCREEN_WIDTH, h: 350 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/topics/${id}`);
      if (!res.ok) throw new Error('Station connection failed');
      const json = await res.json();
      console.log('links count:', json.links?.length, 'nodes:', json.nodes?.length);
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? 'Signal lost');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const layoutNodes = useMemo(() => {
    if (!data || graphDims.w <= 0) return [];
    return computeAntigravityLayout(data.nodes, data.links, graphDims.w, graphDims.h);
  }, [data, graphDims]);

  useEffect(() => {
    if (layoutNodes.length > 0 && !selectedNode) {
      setSelectedNode(layoutNodes[0]);
    }
  }, [layoutNodes]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.accent} size={24} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>{id}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.accent }]}>COMPUTING ANTIGRAVITY POSITIONS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Info color={colors.error} size={48} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>Signal Offline</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error || 'Zero topics located'}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.accent }]} onPress={fetchData}>
            <Text style={[styles.retryText, { color: scheme === 'light' ? '#fff' : '#003732' }]}>Reconnect</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.accent} size={24} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>PRIORITY MAP</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{id}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Analytics Card */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={[styles.analyticsCol, { borderRightColor: colors.border }]}>
            <Text style={[styles.analyticsVal, { color: colors.text }]}>{data.nodes.length}</Text>
            <Text style={[styles.analyticsKey, { color: colors.textSecondary }]}>TOPICS</Text>
          </View>
          <View style={[styles.analyticsCol, { borderRightColor: colors.border }]}>
            <Text style={[styles.analyticsVal, { color: colors.text }]}>{data.paper_count}</Text>
            <Text style={[styles.analyticsKey, { color: colors.textSecondary }]}>PAPERS</Text>
          </View>
          <View style={styles.analyticsCol}>
            <Text style={[styles.analyticsVal, { color: colors.text }]}>
              {Math.round(data.nodes.reduce((acc, n) => acc + n.confidence, 0) / data.nodes.length * 100)}%
            </Text>
            <Text style={[styles.analyticsKey, { color: colors.textSecondary }]}>SYNC</Text>
          </View>
        </View>

        {/* Dynamic Graph Area */}
        <View 
          style={styles.graphContainer}
          onLayout={(e) => setGraphDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <Marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <Polygon points="0,0 6,3 0,6" fill={colors.accentSecondary} />
              </Marker>
            </Defs>

            {/* Render Links */}
            {data.links.map((link, i) => {
              const src = layoutNodes.find(n => n.id === link.source);
              const tgt = layoutNodes.find(n => n.id === link.target);
              if (!src || !tgt) return null;
              return (
                <Path
                  key={`link-${i}`}
                  d={edgePath(src.x, src.y, PRIORITY_RADII[src.priority], tgt.x, tgt.y, PRIORITY_RADII[tgt.priority])}
                  stroke="rgba(107,216,203,0.15)"
                  strokeWidth={1}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}

            {/* Render Nodes + Labels */}
            {layoutNodes.map(node => {
              const color = PRIORITY_COLORS[node.priority];
              const r = PRIORITY_RADII[node.priority];
              const isSelected = selectedNode?.id === node.id;

              return (
                <React.Fragment key={node.id}>
                  {/* Outer pulse if selected */}
                  {isSelected && (
                    <Circle cx={node.x} cy={node.y} r={r + 8} fill={`${color}15`} />
                  )}
                  
                  {/* Topic Circle */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={colors.surface}
                    stroke={isSelected ? color : `${color}80`}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    onPress={() => setSelectedNode(node)}
                  />

                  {/* Topic Name Label */}
                  <SvgText
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fill={isSelected ? colors.text : colors.textSecondary}
                    fontSize={10}
                    fontFamily="JetBrainsMono-Bold"
                    fontWeight="bold"
                  >
                    {node.label.length > 15 ? node.label.substring(0, 13) + '..' : node.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Context Card */}
        {selectedNode && (
          <View style={[styles.contextCard, { backgroundColor: colors.surface, borderColor: colors.accentSecondary, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityTag, { borderColor: `${PRIORITY_COLORS[selectedNode.priority]}40` }]}>
                <Text style={[styles.priorityTagText, { color: PRIORITY_COLORS[selectedNode.priority] }]}>
                  {selectedNode.priority} LVL
                </Text>
              </View>
              {selectedNode.priority === 'HIGH' && <Star color="#FFD700" size={14} fill="#FFD700" />}
            </View>

            <Text style={[styles.topicTitle, { color: colors.text }]}>{selectedNode.label}</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>EXAM WEIGHT</Text>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{Math.round(selectedNode.exam_frequency * 100)}%</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PEER DIFF</Text>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{Math.round(selectedNode.peer_difficulty * 100)}%</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>RETENTION</Text>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{Math.round(selectedNode.confidence * 100)}%</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.quizBtn, { backgroundColor: colors.accentSecondary, borderColor: colors.border }]}
                onPress={() => router.push(`/quiz/${id}`)}
              >
                <Text style={[styles.quizBtnText, { color: colors.accent }]}>TAKE QUIZ</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => router.push(`/focus/${id}`)}
              >
                <LinearGradient
                  colors={scheme === 'dark' ? ['#13b5a7', '#077169'] : ['#0d9488', '#0f766e']}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>FOCUS</Text>
                  <ChevronRight color="white" size={16} />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61,73,71,0.2)',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    color: '#6bd8cb',
    fontSize: 16,
    fontFamily: Fonts.mono,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#879391',
    fontSize: 10,
    fontFamily: Fonts.mono,
    marginTop: 2,
    letterSpacing: 1,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 20, paddingBottom: 120 },
  analyticsCard: {
    flexDirection: 'row',
    backgroundColor: '#141b2b',
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(61,73,71,0.2)',
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, color: 'rgba(0,0,0,0.5)' }],
  },
  analyticsCol: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(61,73,71,0.1)' },
  analyticsVal: { color: '#dce2f7', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  analyticsKey: { color: '#879391', fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 1.5 },
  graphContainer: { flex: 1, marginBottom: 24, backgroundColor: 'rgba(7,14,29,0.3)', borderRadius: 20 },
  contextCard: {
    backgroundColor: '#141b2b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(107, 216, 203, 0.2)',
    boxShadow: [{ offsetX: 0, offsetY: -10, blurRadius: 30, color: 'rgba(0,0,0,0.4)' }],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priorityTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  priorityTagText: { fontSize: 9, fontWeight: 'bold', fontFamily: Fonts.mono, letterSpacing: 1 },
  topicTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20, fontFamily: Fonts.primary },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metric: { flex: 1 },
  metricLabel: { color: '#879391', fontSize: 9, marginBottom: 6, fontFamily: Fonts.mono, letterSpacing: 1 },
  metricValue: { color: '#6bd8cb', fontSize: 18, fontWeight: 'bold' },
  actionBtn: { borderRadius: 14, overflow: 'hidden' },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  btnText: { color: 'white', fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, fontFamily: Fonts.mono },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6bd8cb', marginTop: 16, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  errorTitle: { color: '#ffb4ab', fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  errorText: { color: '#879391', textAlign: 'center', marginBottom: 24, fontSize: 13 },
  retryButton: { backgroundColor: '#6bd8cb', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  retryText: { color: '#003732', fontWeight: 'bold', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  quizBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(107,216,203,0.3)',
    backgroundColor: 'rgba(107,216,203,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  quizBtnText: {
    color: '#6bd8cb',
    fontSize: 12,
    fontFamily: Fonts.mono,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
});
