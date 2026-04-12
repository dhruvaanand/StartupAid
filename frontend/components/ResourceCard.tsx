import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { Fonts, Palette } from '@/constants/theme';

type ResourceCardProps = {
  name: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
};

export function ResourceCard({ name, sizeBytes, createdAt, url }: ResourceCardProps) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const formattedSize = (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleOpen = () => {
    Linking.openURL(url).catch((err) => console.error("Couldn't open URL", err));
  };

  return (
    <View style={[styles.outer, { shadowColor: colors.shadow }]}>
      <View style={[styles.inner, { shadowColor: colors.shadowDark }]}>
        <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleOpen}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <FileText size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {formattedSize} • {formattedDate}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    marginBottom: 16,
  },
  inner: {
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.secondary,
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: Fonts.body,
    marginTop: 2,
  },
});
