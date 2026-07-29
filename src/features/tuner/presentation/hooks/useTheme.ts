import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTunerStore } from '../state/useTunerStore';
import { useEffect } from 'react';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useTunerStore((s) => s.themeMode);
  
  const scheme = themeMode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : themeMode;
    
  const themeColors = Colors[scheme];

  // Dynamically synchronize the body background and text color on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = themeColors.background;
      document.body.style.color = themeColors.textPrimary;
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
  }, [scheme, themeColors]);

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
    themeMode,
  };
}
