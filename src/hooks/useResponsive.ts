import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

export interface ResponsiveValues {
  isCompact: boolean;
  isRegular: boolean;
  isTablet: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontScale: number;
  contentMaxWidth: number;
  insets: EdgeInsets;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Screen categorization
  // isCompact: small phones (e.g. iPhone SE/mini, height < 700 or width < 360)
  const isCompact = height < 700 || width < 360;
  // isTablet: screen width >= 600 (e.g. iPads, tablets, or horizontal layout phones)
  const isTablet = width >= 600;
  // isRegular: standard smartphone dimensions
  const isRegular = !isCompact && !isTablet;

  // Spacing system that scales with screen size
  const spacing = {
    xs: isCompact ? 2 : (isTablet ? 6 : 4),
    sm: isCompact ? 6 : (isTablet ? 12 : 8),
    md: isCompact ? 12 : (isTablet ? 20 : 16),
    lg: isCompact ? 16 : (isTablet ? 32 : 24),
    xl: isCompact ? 24 : (isTablet ? 48 : 32),
    xxl: isCompact ? 32 : (isTablet ? 64 : 48),
  };

  // Font scale factor for responsive typography
  const fontScale = isCompact ? 0.85 : (isTablet ? 1.15 : 1.0);

  const contentMaxWidth = 800; // standard maximum width for tablet layouts

  return {
    isCompact,
    isRegular,
    isTablet,
    spacing,
    fontScale,
    contentMaxWidth,
    insets,
    width,
    height,
  };
}
