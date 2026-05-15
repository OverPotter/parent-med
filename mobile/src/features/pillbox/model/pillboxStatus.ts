export type PillboxDisplayStatus =
  | "active"
  | "paused"
  | "completed"
  | "archived"
  | "attention"
  | "missed";

export type PillboxStatusTone =
  | "active"
  | "paused"
  | "attention"
  | "missed"
  | "completed";

export function resolvePillboxStatusTone(
  status: PillboxDisplayStatus,
): PillboxStatusTone {
  if (status === "paused") {
    return "paused";
  }
  if (status === "attention") {
    return "attention";
  }
  if (status === "missed") {
    return "missed";
  }
  if (status === "completed" || status === "archived") {
    return "completed";
  }
  return "active";
}

export function isPillboxStatusAlert(status: PillboxDisplayStatus) {
  return status === "attention" || status === "missed";
}
