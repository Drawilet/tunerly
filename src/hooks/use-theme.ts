import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useTunerStore } from '@/features/tuner/presentation/state/useTunerStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useTunerStore((s) => s.themeMode);

  const scheme = themeMode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : themeMode;

  return Colors[scheme];
}
