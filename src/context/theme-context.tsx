"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreferences = {
  accent: string;
  includeOptionalEntries: boolean;
  setAccent: (value: string) => void;
  setIncludeOptionalEntries: (value: boolean) => void;
};

const ThemeContext = createContext<ThemePreferences | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accent, setAccent] = useState<string>("#64748b");
  const [includeOptionalEntries, setIncludeOptionalEntries] =
    useState<boolean>(true);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-neon", accent);
  }, [accent]);

  const value = useMemo(
    () => ({
      accent,
      includeOptionalEntries,
      setAccent,
      setIncludeOptionalEntries,
    }),
    [accent, includeOptionalEntries]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemePreferences => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
