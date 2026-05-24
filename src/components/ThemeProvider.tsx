"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getCurrentTheme(): Theme {
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return "dark";
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);

  const applyTheme = useCallback(
    (next: Theme, persist = true) => {
      setThemeState(next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      if (persist) {
        localStorage.setItem("theme", next);
      }
    },
    []
  );

  useEffect(() => {
    setThemeState(getCurrentTheme());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "light" ? "dark" : "light");
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (next: Theme) => applyTheme(next),
    [applyTheme]
  );

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
