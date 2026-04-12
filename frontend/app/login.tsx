import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Fonts, Palette } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const router = useRouter();
  const { signInDev } = useAuth();
  const scheme = useColorScheme() ?? 'dark';
  const colors = Palette[scheme];

  const buttonScale = useState(new Animated.Value(1))[0];

  const animatePress = (pressed: boolean) => {
    Animated.spring(buttonScale, {
      toValue: pressed ? 0.97 : 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  async function sendOtp() {
    setErrorMessage(null);
    if (!email) { setErrorMessage('Enter a valid student email.'); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setErrorMessage(error.message || 'Rate limit or network error.');
      else setStep('otp');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setErrorMessage(null);
    if (!otp) { setErrorMessage('Enter the 6-digit code.'); return; }
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email, token: otp, type: 'email',
      });
      if (error) setErrorMessage(error.message || 'Invalid code.');
      else if (session) router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function signInDev_() {
    setErrorMessage(null);
    if (!email) { setErrorMessage('Enter an email.'); return; }
    signInDev(email);
    router.replace('/(tabs)');
  }

  const handlePrimary = isDevMode ? signInDev_ : step === 'email' ? sendOtp : verifyOtp;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centerWrap}>
          {/* Card */}
          <View style={[styles.cardOuter, { shadowColor: colors.shadow }]}>
            <View style={[styles.cardInner, { shadowColor: colors.shadowDark }]}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                {/* Logo */}
                <View style={styles.logoRow}>
                  <Image
                    source={require('@/brand_assets/waving_bear.png')}
                    style={styles.logoMascot}
                    contentFit="contain"
                  />
                  <Text style={[styles.logoText, { color: colors.accent }]}>gommies</Text>
                </View>

                {/* Subtitle */}
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isDevMode
                    ? 'Development mode'
                    : step === 'email'
                    ? 'Sign in with student email'
                    : 'Enter the 6-digit code sent to your email'}
                </Text>

                {/* Input */}
                <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.shadowDark }]}>
                  {step === 'email' || isDevMode ? (
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter student email"
                      placeholderTextColor={colors.textSecondary + '70'}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="done"
                      onSubmitEditing={handlePrimary}
                    />
                  ) : (
                    <TextInput
                      style={[styles.input, styles.inputCenter, { color: colors.text }]}
                      placeholder="6-digit code"
                      placeholderTextColor={colors.textSecondary + '70'}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handlePrimary}
                    />
                  )}
                </View>

                {/* Error */}
                {errorMessage && (
                  <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
                )}

                {/* CTA */}
                {loading ? (
                  <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
                ) : (
                  <Pressable
                    onPressIn={() => animatePress(true)}
                    onPressOut={() => animatePress(false)}
                    onPress={handlePrimary}
                  >
                    <Animated.View style={[styles.cta, { transform: [{ scale: buttonScale }], backgroundColor: colors.accent, shadowColor: colors.accent }]}>
                      <Text style={[styles.ctaText, { color: scheme === 'light' ? '#fff' : '#00201d' }]}>
                        {isDevMode ? 'INSTANT LOGIN' : step === 'email' ? 'SEND CODE' : 'VERIFY & LOGIN'}
                      </Text>
                    </Animated.View>
                  </Pressable>
                )}

                {/* Back link */}
                {step === 'otp' && !isDevMode && (
                  <Pressable onPress={() => setStep('email')} style={styles.backLink}>
                    <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>Wrong email? Go back</Text>
                  </Pressable>
                )}
                {step === 'otp' && !isDevMode && (
                  <Pressable style={styles.backLink} onPress={() => void sendOtp()}>
                    <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>Resend code</Text>
                  </Pressable>
                )}

              </View>
            </View>
          </View>

          {/* Dev mode toggle */}
          <Pressable
            style={[styles.devToggle, { borderColor: colors.border }, isDevMode && { borderColor: colors.accent }]}
            onPress={() => setIsDevMode(!isDevMode)}
          >
            <Text style={[styles.devToggleText, { color: colors.textSecondary }, isDevMode && { color: colors.accent }]}>
              {isDevMode ? 'NORMAL MODE' : 'DEV MODE'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c1322' },
  flex: { flex: 1 },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  cardOuter: {
    boxShadow: [{
      offsetX: -10,
      offsetY: -10,
      blurRadius: 20,
      color: 'rgba(27, 37, 55, 0.5)',
    }],
    borderRadius: 28,
  },
  cardInner: {
    boxShadow: [{
      offsetX: 10,
      offsetY: 10,
      blurRadius: 20,
      color: '#080c14',
    }],
    borderRadius: 28,
  },
  card: {
    backgroundColor: '#141b2b',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: '#3d4947',
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  logoMascot: {
    width: 72,
    height: 72,
  },
  logoText: {
    color: '#6bd8cb',
    fontSize: 32,
    fontFamily: Fonts?.primary ?? 'system',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#879391',
    fontSize: 14,
    fontFamily: Fonts?.body ?? 'system',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputWrap: {
    backgroundColor: '#070e1d',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3d4947',
    marginBottom: 12,
    boxShadow: [{
      offsetX: 3,
      offsetY: 3,
      blurRadius: 6,
      color: 'rgba(0,0,0,0.8)',
      inset: true,
    }],
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: '#dce2f7',
    fontSize: 15,
    fontFamily: Fonts?.body ?? 'system',
  },
  inputCenter: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: Fonts?.body ?? 'system',
    textAlign: 'center',
    marginBottom: 12,
  },
  cta: {
    backgroundColor: '#6bd8cb',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: [{
      offsetX: 0,
      offsetY: 4,
      blurRadius: 12,
      color: 'rgba(107, 216, 203, 0.3)',
    }],
  },
  ctaText: {
    color: '#00201d',
    fontSize: 15,
    fontFamily: Fonts?.secondary ?? 'system',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  backLinkText: {
    color: '#3d4947',
    fontSize: 13,
    fontFamily: Fonts?.body ?? 'system',
  },
  devToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#3d4947',
  },
  devToggleText: {
    color: '#3d4947',
    fontSize: 10,
    fontFamily: Fonts?.label ?? 'system',
    letterSpacing: 1.5,
  },
});
