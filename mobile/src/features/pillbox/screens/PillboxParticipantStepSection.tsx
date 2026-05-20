import { Pressable, Text, View } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { PillboxParticipantOption } from "../model/pillboxPlanOnboarding";
import { Hero } from "./pillboxPlanOnboardingParts";
import { pillboxPlanOnboardingStyles as styles } from "./pillboxPlanOnboardingStyles";

export function PillboxParticipantStepSection({
  locale,
  participants,
  participantId,
  onSelectParticipant,
}: {
  locale: MobileLocale;
  participants: PillboxParticipantOption[];
  participantId: string | null;
  onSelectParticipant: (participantId: string) => void;
}) {
  const title =
    locale === "ru"
      ? "Для кого этот план?"
      : locale === "de"
        ? "Für wen ist dieser Plan?"
        : locale === "pl"
          ? "Dla kogo jest ten plan?"
          : "Who is this plan for?";
  const subtitle =
    locale === "ru"
      ? "Выберите участника, для которого мы составим план приёма."
      : locale === "de"
        ? "Wählen Sie die Person aus, für die wir den Einnahmeplan erstellen."
        : locale === "pl"
          ? "Wybierz osobę, dla której przygotujemy plan przyjmowania."
          : "Choose the person for whom we will create the medication plan.";
  return (
    <>
      <Hero title={title} subtitle={subtitle} />
      <View style={styles.sectionWrap}>
        <View style={styles.participantListCard}>
          {participants.map((item, index) => {
            const selected = participantId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectParticipant(item.id)}
                style={({ pressed }) => [
                  styles.participantRow,
                  index === participants.length - 1 ? styles.participantRowLast : null,
                  selected ? styles.participantRowSelected : null,
                  pressed ? styles.backLinkPressed : null,
                ]}
              >
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>{item.avatarText}</Text>
                </View>
                <View style={styles.participantCopy}>
                  <Text style={styles.participantTitle}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.participantSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Text style={styles.chevronText}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
