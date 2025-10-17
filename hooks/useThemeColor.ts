import { Colors } from '@/constants/Colors';

const themeColors = {
  background: Colors.background,
  text: Colors.text.primary,
  tint: Colors.primary,
  icon: Colors.text.secondary,
  tabIconDefault: Colors.text.muted,
  tabIconSelected: Colors.primary,
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof themeColors
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return themeColors[colorName] || Colors.text.primary;
  }
}
