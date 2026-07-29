import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const themeColors = Colors[scheme];

  return {
    background: themeColors.background,
    card: themeColors.surface,
    text: themeColors.textPrimary,
    textSecondary: themeColors.textSecondary,
    textTertiary: themeColors.textTertiary,
    border: themeColors.separator,
    accent: themeColors.primary,
    success: themeColors.success,
    warning: themeColors.warning,
    error: themeColors.error,
    tunerCircle: themeColors.surface,
    tunerInnerCircle: themeColors.background,
    isDark: scheme === 'dark',
  };
}
