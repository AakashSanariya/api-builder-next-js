"use client";

import { useEffect, useState } from "react";

function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  destructive: string;
  ring: string;
  primaryRgba: (alpha: number) => string;
  foregroundRgba: (alpha: number) => string;
  borderRgba: (alpha: number) => string;
}

function readColors(): ThemeColors {
  const p = getCSSVar("--primary");
  const pf = getCSSVar("--primary-foreground");
  const bg = getCSSVar("--background");
  const fg = getCSSVar("--foreground");
  const card = getCSSVar("--card");
  const cf = getCSSVar("--card-foreground");
  const muted = getCSSVar("--muted");
  const mf = getCSSVar("--muted-foreground");
  const border = getCSSVar("--border");
  const accent = getCSSVar("--accent");
  const destructive = getCSSVar("--destructive");
  const ring = getCSSVar("--ring");

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(/\s+/).map((v) => parseFloat(v));
    const a = s / 100;
    const b = (l / 100) * (1 - a);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * (b + c))
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const primaryHex = hslToHex(p || "245 100% 60%");
  const fgHex = hslToHex(fg || "224 71% 4%");
  const borderHex = hslToHex(border || "220 13% 91%");

  return {
    primary: primaryHex,
    primaryForeground: hslToHex(pf || "210 20% 98%"),
    background: hslToHex(bg || "210 20% 98%"),
    foreground: fgHex,
    card: hslToHex(card || "0 0% 100%"),
    cardForeground: hslToHex(cf || "224 71% 4%"),
    muted: hslToHex(muted || "220 14% 96%"),
    mutedForeground: hslToHex(mf || "220 9% 46%"),
    border: borderHex,
    accent: hslToHex(accent || "245 100% 96%"),
    destructive: hslToHex(destructive || "0 84% 60%"),
    ring: hslToHex(ring || "245 100% 60%"),
    primaryRgba: (alpha: number) => hexToRgba(primaryHex, alpha),
    foregroundRgba: (alpha: number) => hexToRgba(fgHex, alpha),
    borderRgba: (alpha: number) => hexToRgba(borderHex, alpha),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(readColors);

  useEffect(() => {
    setColors(readColors());
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
