"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type ThemeContextType = {
  dark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggleDark: () => {},
});

const THEME_KEY = "xoqon_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "");
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
