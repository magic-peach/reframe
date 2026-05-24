"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "high-contrast";

interface ThemeContextValue {
  // `theme` may be `undefined` on the first render (SSR) until we
  // determine it on the client.
  theme?: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start uninitialized to avoid SSR/client mismatch. We will read
  // the real theme on mount (client-only) and then sync state + DOM.
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);

  const applyTheme = useCallback((next: Theme, persist = true) => {
    setThemeState(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (next === "high-contrast") {
      document.documentElement.setAttribute("data-theme", "high-contrast");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    if (persist) {
      try {
        localStorage.setItem("theme", next);
      } catch {}
    }
  }, []);

  // Client-only initialization: read localStorage or system preference
  // and apply the theme. This avoids reading `document`/`localStorage`
  // during SSR and prevents hydration mismatches.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "high-contrast") {
        applyTheme(stored, false);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light", false);
      }
    } catch {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light", false);
    }

    // Listen for OS-level preference changes (only when no manual override)
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "dark" : "light", false);
        }
      } catch {}
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    // If theme is undefined (very early), default to light -> dark toggle
    const current = theme ?? "light";
    applyTheme(
      current === "light" ? "dark" : current === "dark" ? "high-contrast" : "light"
    );
  }, [theme, applyTheme]);

  const setTheme = useCallback((next: Theme) => applyTheme(next), [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
