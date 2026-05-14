"use client";

import { ConfigProvider } from "antd";

import { retromindDarkTheme, luminousLightTheme, type AppTheme } from "@/theme/antd-theme";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";

type AppProvidersProps = {
  children: React.ReactNode;
  customThemes?: readonly AppTheme[];
};

function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const activeTheme = isDark ? retromindDarkTheme : luminousLightTheme;

  return <ConfigProvider theme={activeTheme}>{children}</ConfigProvider>;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ThemeConfigProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeConfigProvider>
    </ThemeProvider>
  );
}
