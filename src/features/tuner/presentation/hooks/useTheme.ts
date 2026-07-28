import { useColorScheme } from 'react-native';

export const lightTheme = {
  background: '#F5F5F7', // Apple Light Gray background
  card: '#FFFFFF',       // Apple pure white card
  text: '#000000',       // primary text
  textSecondary: '#3A3A3C', // secondary text
  textTertiary: '#8E8E93', // gray caption text
  border: '#E5E5EA',     // Apple light border
  accent: '#0285FD',     // Apple premium brand accent
  success: '#10B981',    // Emerald green for in-tune
  tunerCircle: '#FFFFFF',
  tunerInnerCircle: '#F5F5F7',
  isDark: false,
};

export const darkTheme = {
  background: '#0A0A0A', // Apple Near Black background
  card: '#1C1C1E',       // Apple dark gray card
  text: '#FFFFFF',       // primary text
  textSecondary: '#E5E5EA', // secondary text
  textTertiary: '#8E8E93', // gray caption text
  border: '#2C2C2E',     // Apple dark border
  accent: '#0285FD',     // Apple premium brand accent
  success: '#10B981',    // Emerald green
  tunerCircle: '#1C1C1E',
  tunerInnerCircle: '#0A0A0A',
  isDark: true,
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
