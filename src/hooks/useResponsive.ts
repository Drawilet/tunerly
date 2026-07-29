import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

export interface ResponsiveValues {
  isCompact: boolean;
  isRegular: boolean;
  isTablet: boolean;
  isDesktop: boolean;
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
  const isTablet = width >= 600 && width < 1024;
  // isDesktop: screen width >= 1024 (e.g. desktop monitors, laptops, large screens)
  const isDesktop = width >= 1024;
  // isRegular: standard smartphone dimensions
  const isRegular = !isCompact && !isTablet && !isDesktop;

  // Spacing system that scales with screen size
  const spacing = {
    xs: isCompact ? 2 : (isDesktop ? 8 : (isTablet ? 6 : 4)),
    sm: isCompact ? 6 : (isDesktop ? 16 : (isTablet ? 12 : 8)),
    md: isCompact ? 12 : (isDesktop ? 28 : (isTablet ? 20 : 16)),
    lg: isCompact ? 16 : (isDesktop ? 40 : (isTablet ? 32 : 24)),
    xl: isCompact ? 24 : (isDesktop ? 56 : (isTablet ? 48 : 32)),
    xxl: isCompact ? 32 : (isDesktop ? 80 : (isTablet ? 64 : 48)),
  };

  // Font scale factor for responsive typography
  const fontScale = isCompact ? 0.85 : (isDesktop ? 1.35 : (isTablet ? 1.15 : 1.0));

  // standard maximum width for tablet & desktop layouts
  const contentMaxWidth = isDesktop ? 1200 : 800;

  return {
    isCompact,
    isRegular,
    isTablet,
    isDesktop,
    spacing,
    fontScale,
    contentMaxWidth,
    insets,
    width,
    height,
  };
}
