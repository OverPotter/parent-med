import { buildAuthScreenContent } from "../authScreen";

describe("buildAuthScreenContent", () => {
  it("returns moved polish auth copy for submit and error states", () => {
    const content = buildAuthScreenContent("pl");

    expect(content.tabs[0]?.label).toBe("Zaloguj się");
    expect(content.registerSubmittingLabel).toBe("Tworzenie…");
    expect(content.loginSubmittingLabel).toBe("Logowanie…");
    expect(content.familyCodeVerifyFailedError).toBe(
      "Nie udało się sprawdzić kodu rodziny.",
    );
    expect(content.resetPasswordFailedError).toBe(
      "Nie udało się zresetować hasła.",
    );
  });
});
