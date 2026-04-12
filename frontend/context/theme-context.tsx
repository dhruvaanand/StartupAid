import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeScheme = 'light' | 'dark';

interface ThemeContextType {
  scheme: ThemeScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (scheme: ThemeScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'dark';
  const [scheme, setSchemeState] = useState<ThemeScheme>(systemScheme);

  // Load persisted theme on mount
  useEffect(() => {
    (async () => {
      try {
        const persisted = await AsyncStorage.getItem('user-theme');
        if (persisted === 'light' || persisted === 'dark') {
          setSchemeState(persisted);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    })();
  }, []);

  const setTheme = async (newScheme: ThemeScheme) => {
    setSchemeState(newScheme);
    try {
      await AsyncStorage.setItem('user-theme', newScheme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const toggleTheme = () => {
    setTheme(scheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ scheme, isDark: scheme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
