import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'react-native';
import { Fonts, Palette } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface NudgeToastProps {
  visible: boolean;
  senderName: string;
  type: 'wave' | 'cheer' | 'remind';
  onFinished: () => void;
}

export default function NudgeToast({ visible, senderName, type, onFinished }: NudgeToastProps) {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(slideAnim, {
          toValue: 20,
          useNativeDriver: true,
          tension: 40,
          friction: 7
        }),
        Animated.delay(3000),
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        onFinished();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const messages = {
    wave: "is waving at you!",
    cheer: "is cheering you on!",
    remind: "sent you a focus reminder!"
  };

  const initials = senderName.charAt(0).toUpperCase();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.outer, { shadowColor: colors.shadow }]}>
        <View style={[styles.inner, { shadowColor: colors.shadowDark }]}>
          <BlurView intensity={80} tint={scheme === 'dark' ? 'dark' : 'light'} style={[styles.content, { backgroundColor: scheme === 'dark' ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)', borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
               <Text style={[styles.avatarText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>{initials}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.senderText, { color: colors.text }]}>{senderName}</Text>
              <Text style={[styles.messageText, { color: colors.textSecondary }]}>{messages[type]}</Text>
            </View>
          </BlurView>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 64,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  outer: {
    width: '100%',
    borderRadius: 99,
  },
  inner: {
    borderRadius: 99,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.primary,
  },
  textContainer: {
    flex: 1,
  },
  senderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Fonts.primary,
  },
  messageText: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 1,
  }
});
