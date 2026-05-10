import { ImageSourcePropType } from "react-native";
import { redesignSharedIcons } from "../../../redesign/shared/icons";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";

const childProfileSpec = require("../../../redesign/screens/child-profile/child_profile.json");

type SourceChildProfileSpec = {
  blocks: Array<Record<string, unknown>>;
};

type SelectedChild = {
  nodeId: string;
  name: string;
  stats: string;
  avatarSource: ImageSourcePropType;
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
  avatarSource: ImageSourcePropType;
  statusPills: string[];
  editProfileLabel: string;
  journalTitle: string;
  journalRows: ChildProfileJournalItem[][];
  notesTitle: string;
  notesBody: string;
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
  child: SelectedChild,
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

  const summarySection = profileCard.sections.find(
    (section) => section.type === "profileTopRow",
  ) as
    | {
        items: Array<Record<string, unknown>>;
      }
    | undefined;

  const summaryBlock = summarySection?.items.find(
    (item) => item.type === "summary",
  ) as
    | {
        items: Array<Record<string, unknown>>;
      }
    | undefined;

  const allergyStatsRow = summaryBlock?.items.find(
    (item) => item.type === "statsRow" && item.id === "GPN9Y",
  ) as
    | {
        items: Array<{ label: string; value: string }>;
      }
    | undefined;

  const allergiesValue =
    allergyStatsRow?.items.find((item) => item.label === "Аллергии")?.value ??
    "—";

  const { ageValue, weightValue, heightValue } = parseStats(child.stats);

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
    avatarSource: child.avatarSource,
    statusPills:
      statusPillsSection?.items.map((item) => {
        if (isRu) {
          return item.text.value;
        }

        if (isDe) {
          if (item.text.value === "мама") return "Mama";
          if (item.text.value === "аллергия") return "Allergie";
        }

        if (isPl) {
          if (item.text.value === "мама") return "mama";
          if (item.text.value === "аллергия") return "alergia";
        }

        return item.text.value;
      }) ?? [],
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
    notesBody: isRu
      ? notesBlock.body.text
      : isDe
        ? "Hier können Sie wichtige Beobachtungen festhalten: Reaktionen auf Medikamente, Stimmung, Schlaf oder Fragen an den Arzt."
      : isPl
        ? "Tutaj możesz zapisać ważne obserwacje: reakcję na leki, nastrój, sen lub pytania do lekarza."
      : "Use this space for important observations: reaction to medicines, mood, sleep, or questions for a doctor.",
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
