export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ThemePalette {
  background: HSLColor;
  foreground: HSLColor;
  card: HSLColor;
  cardForeground: HSLColor;
  muted: HSLColor;
  mutedForeground: HSLColor;
  border: HSLColor;
  input: HSLColor;
  ring: HSLColor;
  primary: HSLColor;
  primaryForeground: HSLColor;
  accent: HSLColor;
  accentForeground: HSLColor;
  destructive: HSLColor;
  destructiveForeground: HSLColor;
  overlay: HSLColor;
}

export interface StatusColor {
  light: string;
  dark: string;
}

export const themeConfig = {
  light: {
    background:         { h: 210, s: 20, l: 98 },
    foreground:         { h: 224, s: 71, l: 4 },
    card:               { h: 0,   s: 0,  l: 100 },
    cardForeground:     { h: 224, s: 71, l: 4 },
    muted:              { h: 220, s: 14, l: 96 },
    mutedForeground:    { h: 220, s: 9,  l: 46 },
    border:             { h: 220, s: 13, l: 91 },
    input:              { h: 220, s: 13, l: 91 },
    ring:               { h: 245, s: 100, l: 60 },
    primary:            { h: 245, s: 100, l: 60 },
    primaryForeground:  { h: 210, s: 20, l: 98 },
    accent:             { h: 245, s: 100, l: 96 },
    accentForeground:   { h: 245, s: 100, l: 60 },
    destructive:        { h: 0,   s: 84, l: 60 },
    destructiveForeground: { h: 210, s: 20, l: 98 },
    overlay:            { h: 224, s: 71, l: 4 },
  } satisfies ThemePalette,

  dark: {
    background:         { h: 224, s: 71, l: 4 },
    foreground:         { h: 210, s: 20, l: 98 },
    card:               { h: 224, s: 50, l: 10 },
    cardForeground:     { h: 210, s: 20, l: 95 },
    muted:              { h: 224, s: 40, l: 15 },
    mutedForeground:    { h: 220, s: 9,  l: 60 },
    border:             { h: 224, s: 30, l: 20 },
    input:              { h: 224, s: 30, l: 18 },
    ring:               { h: 245, s: 100, l: 60 },
    primary:            { h: 245, s: 100, l: 60 },
    primaryForeground:  { h: 224, s: 71, l: 4 },
    accent:             { h: 245, s: 60, l: 15 },
    accentForeground:   { h: 245, s: 100, l: 75 },
    destructive:        { h: 0,   s: 84, l: 60 },
    destructiveForeground: { h: 224, s: 71, l: 4 },
    overlay:            { h: 224, s: 71, l: 4 },
  } satisfies ThemePalette,

  brand: {
    50:  "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },

  status: {
    success: { light: "#10b981", dark: "#34d399" } satisfies StatusColor,
    warning: { light: "#f59e0b", dark: "#fbbf24" } satisfies StatusColor,
    error:   { light: "#ef4444", dark: "#f87171" } satisfies StatusColor,
    info:    { light: "#3b82f6", dark: "#60a5fa" } satisfies StatusColor,
  },
} as const;

export function toHsl(c: HSLColor): string {
  return `${c.h} ${c.s}% ${c.l}%`;
}
