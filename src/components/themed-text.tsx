import { StyleSheet, Text, type TextProps } from 'react-native';
import { ThemeColorKey, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'footnote' | 'caption' | 'code';
  themeColor?: ThemeColorKey;
};

export function ThemedText({ style, type = 'body', themeColor = 'textPrimary', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor] },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  largeTitle: Typography.largeTitle,
  title1: Typography.title1,
  title2: Typography.title2,
  title3: Typography.title3,
  headline: Typography.headline,
  body: Typography.body,
  callout: Typography.callout,
  footnote: Typography.footnote,
  caption: Typography.caption,
  code: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 12,
  },
});
