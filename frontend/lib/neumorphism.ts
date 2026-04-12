import { ViewStyle } from 'react-native';

type BackgroundType = '#111827' | '#1F2937' | '#020617';

export const NeumorphColors = {
  '#111827': { light: '#1b2537', dark: '#080c14' },
  '#1F2937': { light: '#2b394d', dark: '#131a23' },
  '#020617': { light: '#0a142e', dark: '#000000' },
};

export const getNeumorphicShadow = (bg: BackgroundType, isPressed: boolean = false): { light: ViewStyle, dark: ViewStyle } => {
  const colors = NeumorphColors[bg];
  
  if (isPressed) {
    // True Inset effect using modern boxShadow (Array format)
    return {
      dark: {
        boxShadow: [{
          offsetX: 4,
          offsetY: 4,
          blurRadius: 8,
          color: colors.dark,
          inset: true,
        }]
      },
      light: {
        boxShadow: [{
          offsetX: -4,
          offsetY: -4,
          blurRadius: 8,
          color: colors.light,
          inset: true,
        }]
      }
    };
  }

  // Raised effect using modern boxShadow (Array format)
  return {
    dark: {
      boxShadow: [{
        offsetX: 8,
        offsetY: 8,
        blurRadius: 16,
        color: colors.dark,
      }]
    },
    light: {
      boxShadow: [{
        offsetX: -8,
        offsetY: -8,
        blurRadius: 16,
        color: colors.light,
      }]
    }
  };
};
