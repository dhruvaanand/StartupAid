import { Platform } from 'react-native';

export const Palette = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#64748b',
    accent: '#0d9488',
    accentSecondary: 'rgba(13,148,136,0.1)',
    border: '#e2e8f0',
    error: '#ea580c',
    errorSecondary: 'rgba(234,88,12,0.1)',
    success: '#10b981',
    successSecondary: 'rgba(16,185,129,0.1)',
    tint: '#0d9488',
    icon: '#64748b',
    shadow: 'rgba(15,23,42,0.08)',
    shadowDark: 'rgba(15,23,42,0.12)',
  },
  dark: {
    background: '#0c1322',
    surface: '#141b2b',
    surfaceSecondary: '#1e293b',
    text: '#dce2f7',
    textSecondary: '#879391',
    accent: '#6bd8cb',
    accentSecondary: 'rgba(107,216,203,0.1)',
    border: 'rgba(61,73,71,0.3)',
    error: '#FB923C',
    errorSecondary: 'rgba(251,146,60,0.15)',
    success: '#0D9488',
    successSecondary: 'rgba(13,148,136,0.15)',
    tint: '#6bd8cb',
    icon: '#879391',
    shadow: 'rgba(0,0,0,0.4)',
    shadowDark: '#080c14',
  },
};

export const Colors = Palette; // Alias for backward compatibility if needed

export const NeumorphColors = {
  light: { light: '#ffffff', dark: '#e2e8f0', bg: '#f8fafc' },
  dark: { light: 'rgba(27,37,55,0.5)', dark: '#080c14', bg: '#0c1322' },
} as const;

export const getNeumorphicShadow = (scheme: 'light' | 'dark', type: 'raised' | 'inset' = 'raised') => {
  const colors = NeumorphColors[scheme];
  if (type === 'inset') return { light: colors.light, dark: colors.dark };
  return {
    shadowColor: scheme === 'light' ? colors.dark : colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: scheme === 'light' ? 0.3 : 0.8,
    shadowRadius: 10,
    elevation: 5,
  };
};

// Space Grotesk for headings, Manrope for body, Inter for small labels
export const Fonts = Platform.select({
  ios: {
    sans: 'SpaceGrotesk_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'JetBrainsMono_700Bold',
    primary: 'SpaceGrotesk_700Bold',
    secondary: 'SpaceGrotesk_600SemiBold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
    label: 'Inter_600SemiBold',
  },
  default: {
    sans: 'SpaceGrotesk_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'JetBrainsMono_700Bold',
    primary: 'SpaceGrotesk_700Bold',
    secondary: 'SpaceGrotesk_600SemiBold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
    label: 'Inter_600SemiBold',
  },
  web: {
    sans: "'Space Grotesk', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: 'JetBrainsMono_700Bold',
    primary: 'SpaceGrotesk_700Bold',
    secondary: 'SpaceGrotesk_600SemiBold',
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
    label: 'Inter_600SemiBold',
  },
});
