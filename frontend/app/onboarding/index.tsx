import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { Fonts } from '@/constants/theme';

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Sign up failed', error.message);
        return;
      }
      router.push('/onboarding/setup');
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <MaterialIcons name="school" size={26} color="#0D9488" />
            <Text style={styles.title}>Welcome to Gommies</Text>
          </View>

          <Text style={styles.subtitle}>Sign up to track your streaks and circles.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@campus.edu"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              placeholderTextColor="#64748B"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.helpRow}>
            <MaterialIcons name="bolt" size={18} color="#FB923C" />
            <Text style={styles.helpText}>Earn XP every time you complete a focus session.</Text>
          </View>

          <View style={styles.footer}>
            <Text
              style={styles.secondaryCta}
              onPress={() => router.push('/(tabs)')}>
              Skip for now
            </Text>

            <Text
              style={[styles.primaryCta, loading && styles.primaryCtaDisabled]}
              onPress={loading ? undefined : onSubmit}>
              {loading ? 'Creating account…' : 'Continue'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: Fonts.secondary,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  helpText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 24,
    gap: 10,
  },
  secondaryCta: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.secondary,
    marginBottom: 4,
  },
  primaryCta: {
    backgroundColor: '#0D9488',
    borderRadius: 18,
    paddingVertical: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Fonts.primary,
  },
  primaryCtaDisabled: {
    opacity: 0.7,
  },
});

