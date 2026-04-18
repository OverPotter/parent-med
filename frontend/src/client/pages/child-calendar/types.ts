export type ViewMode = "feed" | "calendar" | "charts";
export type PeriodKey = "day" | "week" | "twoWeeks" | "month" | "custom";
export type EventKind = "sleep" | "feeding" | "illness" | "weight" | "height";

export interface TimelineEvent {
  id: string;
  kind: EventKind;
  at: string;
  title: string;
  detail: string;
  value?: string;
}

export interface SummaryItem {
  kind: EventKind | "events" | "measurements";
  label: string;
  value: string;
  hint: string;
}

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  kinds: EventKind[];
}

export interface ChartDay {
  date: string;
  sleepMinutes: number;
  feedingCount: number;
  feedingMl: number;
  illnessCount: number;
  weightValue: number | null;
  heightValue: number | null;
}
