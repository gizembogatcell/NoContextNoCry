"use client";

import { createContext, useContext, useEffect, useState } from "react";


const STORAGE_KEY = "retromind-color-scheme";

type ColorScheme = "light" | "dark";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleColorScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
};

function readStoredScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(readStoredScheme);

  useEffect(() => {
    document.body.style.backgroundColor =
      colorScheme === "dark" ? "#15121b" : "#faf8ff";
    document.documentElement.setAttribute("data-theme", colorScheme);
  }, [colorScheme]);

  const toggleColorScheme = () => {
    setColorScheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{ colorScheme, isDark: colorScheme === "dark", toggleColorScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
