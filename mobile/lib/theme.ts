import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const colors = {
  // Backgrounds
  bg: "#000000",
  bgCard: "#1C1C1E",
  bgSecondary: "#2C2C2E",
  bgTertiary: "#3A3A3C",
  bgElevated: "#1C1C1E",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",
  separator: "rgba(255,255,255,0.06)",

  // Text
  text: "#FFFFFF",
  textSecondary: "#EBEBF5",
  textMuted: "#8E8E93",
  textPlaceholder: "#636366",

  // Accent
  indigo: "#6366F1",
  indigoDim: "rgba(99,102,241,0.15)",
  indigoLight: "rgba(99,102,241,0.25)",

  // System colors (iOS-style)
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFD60A",
  amber: "#F59E0B",
  pink: "#FF2D55",
  purple: "#AF52DE",
  teal: "#5AC8FA",

  white: "#FFFFFF",
  black: "#000000",

  // Overlays
  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.3)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fonts = {
  regular: Platform.select({ ios: "System", android: "Roboto" }) as string,
  sizes: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subheadline: 15,
    body: 17,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
  },
};

export const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  tabBarHeight: 85,
  headerHeight: 44,
};
