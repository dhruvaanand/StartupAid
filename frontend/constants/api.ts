import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Gommies API Configuration
 * 
 * In development:
 * - Web: localhost
 * - iOS Simulator: localhost
 * - Android Emulator: 10.0.2.2
 * - Physical Device: Your machine's local IP (detected via Expo)
 */

const getBaseUrl = () => {
  // If we have an override in Expo constants (from debugger or local IP)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

  if (Platform.OS === 'android' && localhost === 'localhost') {
    return 'http://10.0.2.2:8080/v1';
  }

  // Use the detected local IP if available, otherwise fallback to localhost
  return `http://${localhost}:8080/v1`;
};

export const API_URL = getBaseUrl();

console.log('🚀 Gommies API_URL:', API_URL);
