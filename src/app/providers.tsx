"use client";

import { ConfigProvider } from "antd";

import {
  antdNeonTheme,
  getThemeByKey,
  type AntdTheme,
  type AppTheme,
} from "@/app/antd-theme";
import { AuthProvider } from "@/contexts/auth-context";

type AppProvidersProps = {
  children: React.ReactNode;
  customThemes?: readonly AppTheme[];
  theme?: AntdTheme;
  themeKey?: string;
};

export function AppProviders({
  children,
  customThemes = [],
  theme,
  themeKey,
}: AppProvidersProps) {
  const activeTheme =
    theme ?? getThemeByKey(themeKey, customThemes) ?? antdNeonTheme;

  return (
    <ConfigProvider theme={activeTheme}>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  );
}
