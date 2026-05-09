import { buildSupportScreenContent } from "../supportScreen";

describe("buildSupportScreenContent", () => {
  it("returns polish copy instead of falling back to english", () => {
    const content = buildSupportScreenContent("pl");

    expect(content.backLabel).toBe("Wstecz");
    expect(content.title).toBe("Wsparcie / Kontakt");
    expect(content.submitLabel).toBe("Wyślij");
    expect(content.errors.message).toBe("Wpisz wiadomość.");
  });
});
