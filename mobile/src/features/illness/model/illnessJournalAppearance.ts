import type { ImageSourcePropType } from "react-native";
import { illnessAssets } from "../assets";
import type {
  IllnessQuickActionKind,
  MobileIllnessEntry,
} from "./illnessObservation";

export type IllnessJournalIconDescriptor =
  | {
      type: "asset";
      source: ImageSourcePropType;
      variant?: "temperatureChip" | "temperatureQuick" | "temperatureEntry";
    }
  | {
      type: "feather";
      name: "activity";
      size: number;
      color: string;
    };

export function getIllnessSummaryChipAppearance(
  kind: "temperature" | "medicine" | "reminder",
) {
  if (kind === "temperature") {
    return {
      backgroundColor: "#FFF9F8",
      borderColor: "#F1DAD4",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickTemperature,
        variant: "temperatureChip" as const,
      },
    };
  }

  if (kind === "medicine") {
    return {
      backgroundColor: "#FFF9F2",
      borderColor: "#F1DAD0",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickMedicine,
      },
    };
  }

  return {
    backgroundColor: "#FFFAFF",
    borderColor: "#E8DDF5",
    icon: {
      type: "asset" as const,
      source: illnessAssets.journal.quickReminder,
    },
  };
}

export function getIllnessQuickActionAppearance(kind: IllnessQuickActionKind) {
  if (kind === "temperature") {
    return {
      backgroundColor: "#FFF0F0",
      borderColor: "#F5C7C8",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickTemperature,
        variant: "temperatureQuick" as const,
      },
    };
  }

  if (kind === "medicine") {
    return {
      backgroundColor: "#FFF4E6",
      borderColor: "#F2D4AF",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickMedicine,
      },
    };
  }

  if (kind === "note") {
    return {
      backgroundColor: "#EFFAF3",
      borderColor: "#C8E4D1",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickNote,
      },
    };
  }

  return {
    backgroundColor: "#F5F0FF",
    borderColor: "#D9C9F6",
    icon: {
      type: "asset" as const,
      source: illnessAssets.journal.quickReminder,
    },
  };
}

export function getIllnessEntryAppearance(kind: MobileIllnessEntry["kind"]) {
  if (kind === "temperature") {
    return {
      timelineColor: "#F56F68",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickTemperature,
        variant: "temperatureEntry" as const,
      },
    };
  }

  if (kind === "medicine") {
    return {
      timelineColor: "#F59B45",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickMedicine,
      },
    };
  }

  if (kind === "reminder") {
    return {
      timelineColor: "#8B5CF6",
      icon: {
        type: "asset" as const,
        source: illnessAssets.journal.quickReminder,
      },
    };
  }

  if (kind === "reason") {
    return {
      timelineColor: "#18A7E0",
      icon: {
        type: "feather" as const,
        name: "activity" as const,
        size: 20,
        color: "#18A7E0",
      },
    };
  }

  return {
    timelineColor: "#7EDFA3",
    icon: {
      type: "asset" as const,
      source: illnessAssets.journal.quickNote,
    },
  };
}
