import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props.light;

  if (colorFromProps) return colorFromProps;

  const value = Colors[colorName];

  // If the color entry is a plain string, return it.
  if (typeof value === 'string') return value;

  // If the color entry is an object (e.g., Colors.text or Colors.border),
  // try to pick a sensible default property.
  const objectValue: any = value as any;
  return (
    objectValue.primary || objectValue.dark || objectValue.light || objectValue.inverse || Object.values(objectValue)[0]
  );
}
