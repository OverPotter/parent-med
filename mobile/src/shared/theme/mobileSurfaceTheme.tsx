import { createContext, useContext, type ReactNode } from "react";
export type MobileThemePreference = "light";

type MobileThemeContextValue = {
  preference: MobileThemePreference;
  setPreference: (value: MobileThemePreference) => Promise<void>;
};

const MobileThemeContext = createContext<MobileThemeContextValue | null>(null);

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MobileThemeContext.Provider
      value={{
        preference: "light",
        setPreference: async () => {
          return;
        },
      }}
    >
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileThemePreference() {
  const context = useContext(MobileThemeContext);

  if (!context) {
    throw new Error("useMobileThemePreference must be used inside MobileThemeProvider");
  }

  return context;
}

export function useMobileSurfaceTheme() {
  const { preference } = useMobileThemePreference();

  return {
    isDark: false,
    preference,
    appBackgroundColor: "#FBF3EC",
    backgroundOverlayColor: "rgba(255,248,241,0.52)",
    backgroundOverlaySoftColor: "rgba(255,247,240,0.32)",
    authSoftenerColor: "rgba(34,26,22,0.2)",
    cardBackgroundColor: "#FFF8F0",
    cardMutedBackgroundColor: "#FFFDF9",
    cardBorderColor: "#EBCFC0",
    dividerColor: "#F0DDD4",
    inputBackgroundColor: "#FFFDF9",
    inputBorderColor: "#F0DDD5",
    textPrimaryColor: "#243142",
    textSecondaryColor: "#6A7889",
    textMutedColor: "#8B7A72",
    statusBarStyle: "dark",
  } as const;
}
