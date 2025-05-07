// src/styles/colors.ts
import tinycolor from 'tinycolor2';

export type ColorVariant = 'standard' | 'hover' | 'pressIn';

export interface Color {
  standard: string;
  hover: string;
  pressIn: string;
}

type ColorKey =
  | 'textStandard' | 'backgroundStandard' | 'primaryStandard' | 'secondaryStandard' | 'accentStandard'
  | 'textStandardDark' | 'backgroundStandardDark' | 'primaryStandardDark' | 'secondaryStandardDark' | 'accentStandardDark'
  | 'textSecondary' | 'backgroundStandardLight' | 'borderStandard' | 'borderStandardLight';

const createColorSet = (base: string): Color => {
  const color = tinycolor(base);
  return {
    standard: base,
    hover: color.lighten(4).toString(),
    pressIn: color.darken(4).toString(),
  };
};

const baseColors: Record<ColorKey, string> = {
  textStandard: '#c5d0e2',
  backgroundStandard: '#030507',
  primaryStandard: '#4dc0fe',
  secondaryStandard: '#3a9ed6',
  accentStandard: '#4dfee4',

  textStandardDark: '#1d283a',
  backgroundStandardDark: '#f8fafc',
  primaryStandardDark: '#0174b2',
  secondaryStandardDark: '#298dc7',
  accentStandardDark: '#01b297',

  textSecondary: '#475569',
  backgroundStandardLight: '#ffffff',
  borderStandard: '#CBD5E1',
  borderStandardLight: '#E2E8F0',
};

const colors: Record<ColorKey, Color> = Object.entries(baseColors).reduce((acc, [key, value]) => {
  acc[key as ColorKey] = createColorSet(value);
  return acc;
}, {} as Record<ColorKey, Color>);

export default colors;
