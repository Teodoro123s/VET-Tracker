import { Colors } from '@/constants/Colors';

export function useThemeColor(props, colorName) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
