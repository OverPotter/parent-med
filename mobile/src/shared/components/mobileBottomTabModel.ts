export type MobileBottomTabKey =
  | "journal"
  | "children"
  | "cabinet"
  | "more"
  | "pillbox";

export type MobileBottomTabItem = {
  key: MobileBottomTabKey;
  label: string;
  active: boolean;
};
