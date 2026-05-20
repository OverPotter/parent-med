export function normalizeIllnessMedicineName(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase();
}

export function extractIllnessMedicineNameFromTitle(title: string) {
  return title.split("·")[0]?.trim() ?? title.trim();
}
