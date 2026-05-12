import { ImageSourcePropType } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { ChildCard } from "../../children/model/childrenRedesign";

const childProfileSpec = require("../../../redesign/screens/child-profile/child_profile.json");

type SourceChildProfileSpec = {
  blocks: Array<Record<string, unknown>>;
};

export type ChildProfileJournalItem = {
  id: string;
  label: string;
  iconVariant:
    | "illnessBadge"
    | "feeding"
    | "sleep"
    | "weight"
    | "height"
    | "overview";
  targetKind?: "feeding" | "sleep" | "weight" | "height" | "overview";
  imageSource?: ImageSourcePropType;
  iconColor?: string;
};

export type ChildProfileScreenContent = {
  backLabel: string;
  childName: string;
  ageValue: string;
  weightValue: string;
  heightValue: string;
  allergiesValue: string;
  hasAllergiesValue: boolean;
  avatarSource: ImageSourcePropType | null;
  statusPills: string[];
  editProfileLabel: string;
  journalTitle: string;
  journalRows: ChildProfileJournalItem[][];
  notesTitle: string;
  notesBody: string;
  hasNotesValue: boolean;
  exportTitle: string;
  exportCaption: string;
};

const spec = childProfileSpec as SourceChildProfileSpec;

function getBlock<T extends Record<string, unknown>>(type: string): T {
  const block = spec.blocks.find((item) => item.type === type);

  if (!block) {
    throw new Error(`Missing child profile block: ${type}`);
  }

  return block as T;
}

function parseStats(statsText: string) {
  const parts = statsText
    .split("•")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ageValue: parts[0] ?? "—",
    weightValue: parts[1] ?? "—",
    heightValue: parts[2] ?? "—",
  };
}

function formatCompactAge(birthDate: string | null, fallbackAgeLabel: string | null) {
  if (birthDate) {
    const bornAt = new Date(`${birthDate}T00:00:00`);

    if (!Number.isNaN(bornAt.getTime())) {
      const now = new Date();
      const months =
        (now.getFullYear() - bornAt.getFullYear()) * 12 +
        (now.getMonth() - bornAt.getMonth()) -
        (now.getDate() < bornAt.getDate() ? 1 : 0);

      if (months >= 0) {
        const years = months / 12;
        const rounded = Math.round(years * 10) / 10;
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      }
    }
  }

  if (fallbackAgeLabel) {
    const match = fallbackAgeLabel.match(/(\d+(?:[.,]\d+)?)/);

    if (match) {
      return match[1].replace(",", ".");
    }
  }

  return "—";
}

function mapJournalIcon(label: string) {
  if (label === "Болезни") {
    return {
      iconVariant: "illnessBadge" as const,
      imageSource: redesignSharedIcons.illnessBadge,
    };
  }

  if (label === "Кормление") {
    return {
      iconVariant: "feeding" as const,
      targetKind: "feeding" as const,
      imageSource: redesignSharedIcons.feeding,
    };
  }

  if (label === "Сон") {
    return {
      iconVariant: "sleep" as const,
      targetKind: "sleep" as const,
      imageSource: redesignSharedIcons.sleep,
    };
  }

  if (label === "Рост") {
    return {
      iconVariant: "height" as const,
      targetKind: "height" as const,
      imageSource: redesignSharedIcons.height,
    };
  }

  if (label === "Обзор") {
    return {
      iconVariant: "overview" as const,
      targetKind: "overview" as const,
      imageSource: redesignSharedIcons.overview,
    };
  }

  return {
    iconVariant: "weight" as const,
    targetKind: "weight" as const,
    iconColor: "#6AA58E",
  };
}

export function buildChildProfileScreenContent(
  child: ChildCard,
  locale: MobileLocale,
): ChildProfileScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const topBar = getBlock<{ items: Array<{ text: string }> }>("topBar");
  const profileCard = getBlock<{
    sections: Array<Record<string, unknown>>;
  }>("profileCard");
  const journalTitle = getBlock<{ text: string }>("sectionTitle");
  const journalGrid = getBlock<{
    rows: Array<{ items: Array<Record<string, unknown>> }>;
  }>("journalGrid");
  const notesBlock = getBlock<{
    title: { text: string };
    body: { text: string };
  }>("notesBlock");
  const exportCard = getBlock<{
    title: { text: string };
    caption: { text: string };
  }>("exportCard");

  const statusPillsSection = profileCard.sections.find(
    (section) => section.type === "statusPillsRow",
  ) as
    | {
        items: Array<{
          text: { value: string };
        }>;
      }
    | undefined;

  const primaryButtonSection = profileCard.sections.find(
    (section) => section.type === "primaryButton",
  ) as
    | {
        label: { text: string };
      }
    | undefined;

  const { ageValue: parsedAgeValue } = parseStats(child.stats);
  const ageValue = formatCompactAge(
    child.child.birthDate,
    child.child.ageLabel ?? parsedAgeValue,
  );
  const weightValue = child.child.weightValue || "—";
  const heightValue = child.child.heightValue || "—";
  const trimmedAllergies = child.child.allergies?.trim() || "";
  const trimmedNotes = child.child.notes?.trim() || "";
  const allergiesValue = trimmedAllergies;
  const notesValue = trimmedNotes;
  const statusPills: string[] = [];

  if (child.child.babyModeEnabled) {
    statusPills.push(
      isRu
        ? "режим малыша"
        : isDe
          ? "Baby-Modus"
          : isPl
            ? "tryb niemowlęcia"
            : "baby mode",
    );
  }

  return {
    backLabel: isRu
      ? (topBar.items[0]?.text ?? "← К детям")
      : isDe
        ? "← Zu den Kindern"
      : isPl
        ? "← Do dzieci"
      : "← Back to children",
    childName: child.name,
    ageValue,
    weightValue,
    heightValue,
    allergiesValue,
    hasAllergiesValue: Boolean(trimmedAllergies),
    avatarSource: child.avatarSource,
    statusPills,
    editProfileLabel: isRu
      ? (primaryButtonSection?.label.text ?? "Редактировать профиль")
      : isDe
        ? "Profil bearbeiten"
      : isPl
        ? "Edytuj profil"
      : "Edit profile",
    journalTitle: isRu ? journalTitle.text : isDe ? "Journal" : isPl ? "Dziennik" : "Journal",
    journalRows: journalGrid.rows.map((row) =>
      row.items.map((item) => ({
        id: String(item.id ?? ""),
        label:
          isDe
            ? String(item.label ?? "") === "Болезни"
              ? "Krankheiten"
              : String(item.label ?? "") === "Кормление"
                ? "Fütterung"
                : String(item.label ?? "") === "Сон"
                  ? "Schlaf"
                  : String(item.label ?? "") === "Рост"
                    ? "Größe"
                    : String(item.label ?? "") === "Обзор"
                      ? "Übersicht"
                      : String(item.label ?? "")
            : isPl
            ? String(item.label ?? "") === "Болезни"
              ? "Choroby"
              : String(item.label ?? "") === "Кормление"
                ? "Karmienie"
                : String(item.label ?? "") === "Сон"
                  ? "Sen"
                  : String(item.label ?? "") === "Рост"
                    ? "Wzrost"
                    : String(item.label ?? "") === "Обзор"
                      ? "Przegląd"
                      : String(item.label ?? "")
            : String(item.label ?? ""),
        ...mapJournalIcon(String(item.label ?? "")),
      })),
    ),
    notesTitle: isRu ? notesBlock.title.text : isDe ? "Notizen" : isPl ? "Notatki" : "Notes",
    notesBody: notesValue,
    hasNotesValue: Boolean(trimmedNotes),
    exportTitle: isRu ? exportCard.title.text : isDe ? "Verlauf exportieren" : isPl ? "Eksport historii" : "Export history",
    exportCaption: isRu
      ? exportCard.caption.text
      : isDe
        ? "CSV / Tabelle für Arzt oder Familie"
      : isPl
        ? "CSV / arkusz dla lekarza lub rodziny"
      : "CSV / spreadsheet for doctor or family",
  };
}
