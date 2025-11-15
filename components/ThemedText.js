import { StyleSheet, Text } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}) {
  const color = useThemeColor({ light, dark }, 'text');

  return (
    <Text style={[{ color }, styles[type], style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize,
    lineHeight,
  },
  defaultSemiBold: {
    fontSize,
    lineHeight,
    fontWeight: '600',
  },
  title: {
    fontSize,
    fontWeight: 'bold',
    lineHeight,
  },
  subtitle: {
    fontSize,
    fontWeight: 'bold',
  },
  link: {
    lineHeight,
    fontSize,
    color: '#0a7ea4',
  },
});
