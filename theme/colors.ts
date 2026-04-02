export const Colors = {
  // Core
  background: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1E1E1E',
  card: '#1A1A1A',
  border: '#2A2A2A',

  // Text
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',

  // Accent
  accent: '#00D4FF',       // Electric Blue
  accentDim: '#00A3CC',

  // Feedback
  success: '#39FF14',      // Neon Green
  successDim: '#2BC410',
  warning: '#FFB800',
  danger: '#FF2D2D',
  dangerDim: '#CC2424',

  // Special
  gold: '#FFD700',
  stagnationRed: '#FF0000',
  stagnationBlack: '#000000',
  warmupGray: '#3A3A3A',
  warmupText: '#777777',

  // Plate colors
  plate25: '#FF2D2D',
  plate20: '#2D6BFF',
  plate15: '#FFB800',
  plate10: '#39FF14',
  plate5: '#FFFFFF',
  plate2_5: '#888888',
  plate1_25: '#555555',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  hero: 56,
} as const;

export const FontFamily = {
  mono: 'SpaceMono',      // For weights/numbers – will use system monospace as fallback
  sans: 'System',
} as const;
