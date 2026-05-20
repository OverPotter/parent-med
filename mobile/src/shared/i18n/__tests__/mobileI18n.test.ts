import { normalizeMobileLocale } from "../mobileI18n";

describe("normalizeMobileLocale", () => {
  it("maps supported device locales to the 4 app locales", () => {
    expect(normalizeMobileLocale("ru-RU")).toBe("ru");
    expect(normalizeMobileLocale("de-DE")).toBe("de");
    expect(normalizeMobileLocale("pl-PL")).toBe("pl");
    expect(normalizeMobileLocale("en-US")).toBe("en");
  });

  it("falls back to english for unsupported locales", () => {
    expect(normalizeMobileLocale("fr-FR")).toBe("en");
    expect(normalizeMobileLocale("es")).toBe("en");
    expect(normalizeMobileLocale(null)).toBe("en");
  });
});
