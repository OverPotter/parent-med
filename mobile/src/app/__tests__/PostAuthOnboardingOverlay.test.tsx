import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { MobileAuthSession } from "../../features/auth/api/authApi";
import { MobileThemeProvider } from "../../shared/theme/mobileSurfaceTheme";
import { PostAuthOnboardingOverlay } from "../PostAuthOnboardingOverlay";

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "ru-RU", languageCode: "ru" }]),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text: MockText } = require("react-native");

  return {
    Feather: ({ name }: { name?: string }) =>
      React.createElement(MockText, null, name ?? "icon"),
  };
});

jest.mock("../../features/settings/api/settingsApi", () => ({
  updateRecoveryCode: jest.fn(),
}));

const baseSession: MobileAuthSession = {
  tokenType: "bearer",
  accessToken: "access",
  refreshToken: "refresh",
  account: {
    id: "account-1",
    email: "user@example.com",
    familyId: "family-1",
    displayName: "",
    needsProfileCompletion: true,
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "ru",
    familyRole: "owner",
    hasRecoveryCode: false,
  },
  family: {
    id: "family-1",
    name: "Care Family",
    ownerAccountId: "account-1",
  },
};

function renderOverlay(
  visibleStep: "display-name" | "recovery-code",
  props?: Partial<React.ComponentProps<typeof PostAuthOnboardingOverlay>>,
) {
  return render(
    <MobileThemeProvider>
      <PostAuthOnboardingOverlay
        session={baseSession}
        visibleStep={visibleStep}
        onSkipDisplayName={jest.fn()}
        onSkipRecoveryCode={jest.fn()}
        onSaveDisplayName={jest.fn()}
        onRecoveryCodeSaved={jest.fn()}
        {...props}
      />
    </MobileThemeProvider>,
  );
}

describe("PostAuthOnboardingOverlay", () => {
  it("uses the display-name later action on the first step", () => {
    const onSkipDisplayName = jest.fn();
    const onSkipRecoveryCode = jest.fn();
    const screen = renderOverlay("display-name", {
      onSkipDisplayName,
      onSkipRecoveryCode,
    });

    fireEvent.press(screen.getByText("Позже"));

    expect(onSkipDisplayName).toHaveBeenCalledTimes(1);
    expect(onSkipRecoveryCode).not.toHaveBeenCalled();
  });

  it("uses the recovery-code later action on the second step", () => {
    const onSkipDisplayName = jest.fn();
    const onSkipRecoveryCode = jest.fn();
    const screen = renderOverlay("recovery-code", {
      onSkipDisplayName,
      onSkipRecoveryCode,
    });

    fireEvent.press(screen.getByText("Позже"));

    expect(onSkipRecoveryCode).toHaveBeenCalledTimes(1);
    expect(onSkipDisplayName).not.toHaveBeenCalled();
  });
});
