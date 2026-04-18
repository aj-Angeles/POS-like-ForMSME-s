"use client";

import { useEffect } from "react";

import type { BusinessTheme } from "@/lib/types";
import { useSession } from "@/stores/session-store";

/**
 * Applies the active business's theme JSON as CSS variables on :root.
 * The business record stores a { primary, accent, radius } JSON column;
 * when the user switches businesses (or an Owner edits theming in Settings)
 * the variables update immediately without a rebuild.
 *
 * See docs/THEMING.md for the full customization guide.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const business = useSession((s) => s.business);

  useEffect(() => {
    if (!business?.theme) return;
    const theme = normalize(business.theme as unknown as Partial<BusinessTheme>);
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--radius", theme.radius);
  }, [business?.theme]);

  return <>{children}</>;
}

function normalize(raw: Partial<BusinessTheme>): BusinessTheme {
  return {
    primary: raw.primary ?? "172 66% 42%",
    accent: raw.accent ?? "172 66% 95%",
    radius: raw.radius ?? "0.6rem",
  };
}
