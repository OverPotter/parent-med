import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AuthScreen } from "../AuthScreen";
import { MobileI18nProvider } from "../../../../shared/i18n/mobileI18n";
import type { MobileAuthSession } from "../../api/authApi";
import {
  fetchFamilyInvitePreview,
  loginWithPassword,
  registerWithPassword,
} from "../../api/authApi";

jest.mock("../../api/authApi", () => ({
  fetchFamilyInvitePreview: jest.fn(),
  loginWithPassword: jest.fn(),
  registerWithPassword: jest.fn(),
  resetPasswordByRecoveryCode: jest.fn(),
  toBackendPreferredLanguage: jest.fn(() => "ru"),
  MobileAuthApiError: class MobileAuthApiError extends Error {},
}));

const mockedLoginWithPassword = jest.mocked(loginWithPassword);
const mockedRegisterWithPassword = jest.mocked(registerWithPassword);
const mockedFetchFamilyInvitePreview = jest.mocked(fetchFamilyInvitePreview);

const authSession: MobileAuthSession = {
  tokenType: "bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  account: {
    id: "account-1",
    email: "family@example.com",
    familyId: "family-1",
    displayName: "Anna",
    needsProfileCompletion: false,
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "ru",
    familyRole: "owner",
    hasRecoveryCode: true,
  },
  family: {
    id: "family-1",
    name: "Care Family",
    ownerAccountId: "account-1",
  },
};

function renderAuthScreen(onAuthenticated = jest.fn()) {
  return render(
    <MobileI18nProvider>
      <AuthScreen onAuthenticated={onAuthenticated} />
    </MobileI18nProvider>,
  );
}

describe("AuthScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in with trimmed email and password", async () => {
    mockedLoginWithPassword.mockResolvedValue(authSession);
    const onAuthenticated = jest.fn();
    const screen = renderAuthScreen(onAuthenticated);

    fireEvent.changeText(
      screen.getByPlaceholderText("Электронная почта"),
      "  family@example.com  ",
    );
    fireEvent.changeText(screen.getByPlaceholderText("Пароль"), "secret-pass");
    fireEvent.press(screen.getByText("Войти"));

    await waitFor(() => {
      expect(mockedLoginWithPassword).toHaveBeenCalledWith({
        email: "family@example.com",
        password: "secret-pass",
      });
    });

    expect(onAuthenticated).toHaveBeenCalledWith(authSession);
  });

  it("clears auth fields when switching between login and register", () => {
    const screen = renderAuthScreen();

    fireEvent.changeText(screen.getByPlaceholderText("Электронная почта"), "login@example.com");
    fireEvent.press(screen.getByText("Регистрация"));
    fireEvent.changeText(screen.getByPlaceholderText("Электронная почта"), "register@example.com");
    fireEvent.press(screen.getByText("Вход"));

    expect(screen.getByPlaceholderText("Электронная почта").props.value).toBe("");
  });

  it("verifies family code and sends invite_token during registration", async () => {
    mockedFetchFamilyInvitePreview.mockResolvedValue({
      familyName: "Care Family",
      expiresAt: "2026-12-01T00:00:00Z",
    });
    mockedRegisterWithPassword.mockResolvedValue(authSession);
    const onAuthenticated = jest.fn();
    const screen = renderAuthScreen(onAuthenticated);

    fireEvent.press(screen.getByText("Регистрация"));
    fireEvent.changeText(screen.getByPlaceholderText("Электронная почта"), "new@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Пароль"), "password-123");
    fireEvent.changeText(screen.getByPlaceholderText("Повторите пароль"), "password-123");
    fireEvent.press(screen.getByText("Есть код семьи?"));
    fireEvent.changeText(screen.getByPlaceholderText("Например: ABC12345"), "ABC12345");
    fireEvent.press(screen.getByText("Проверить код"));

    await waitFor(() => {
      expect(mockedFetchFamilyInvitePreview).toHaveBeenCalledWith("ABC12345");
    });

    fireEvent.press(screen.getByText("Создать аккаунт"));

    await waitFor(() => {
      expect(mockedRegisterWithPassword).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password-123",
        preferredLanguage: "ru",
        inviteToken: "ABC12345",
      });
    });

    expect(onAuthenticated).toHaveBeenCalledWith(authSession);
  });
});
