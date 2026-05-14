import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";

type ReminderRecipientsSheetProps = {
  title: string;
  subtitle: string;
  cancelLabel: string;
  saveLabel: string;
  currentUserLabel: string;
  visible: boolean;
  isSaving: boolean;
  members: MobileFamilyMember[];
  currentAccountId: string;
  selectedIds: string[];
  onToggleMember: (memberId: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function ReminderRecipientsSheet({
  title,
  subtitle,
  cancelLabel,
  saveLabel,
  currentUserLabel,
  visible,
  isSaving,
  members,
  currentAccountId,
  selectedIds,
  onToggleMember,
  onClose,
  onSave,
}: ReminderRecipientsSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetCard}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <Text style={styles.sheetSubtitle}>{subtitle}</Text>

        <ScrollView
          style={styles.sheetMembersScroll}
          contentContainerStyle={styles.sheetMembersContent}
          showsVerticalScrollIndicator={false}
        >
          {members.map((member) => {
            const selected = selectedIds.includes(member.id);
            const isCurrentUser = member.id === currentAccountId;

            return (
              <Pressable
                key={member.id}
                onPress={() => onToggleMember(member.id)}
                style={[
                  styles.memberRow,
                  selected ? styles.memberRowSelected : null,
                ]}
              >
                <View style={styles.memberCopy}>
                  <View style={styles.memberTitleRow}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    {isCurrentUser ? (
                      <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>
                          {currentUserLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {member.relationshipLabel ? (
                    <Text style={styles.memberMeta}>{member.relationshipLabel}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.memberCheck,
                    selected ? styles.memberCheckSelected : null,
                  ]}
                >
                  {selected ? <Feather name="check" size={15} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sheetActions}>
          <Pressable style={styles.sheetSecondaryButton} onPress={onClose}>
            <Text style={styles.sheetSecondaryButtonText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.sheetPrimaryButton,
              isSaving ? styles.sheetPrimaryButtonDisabled : null,
            ]}
            onPress={onSave}
            disabled={isSaving}
          >
            <Text style={styles.sheetPrimaryButtonText}>{saveLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 32, 43, 0.24)",
  },
  sheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFCF8",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#EED8CE",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#DDC8BE",
    marginBottom: 14,
  },
  sheetTitle: {
    color: "#1E2A3A",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  sheetSubtitle: {
    marginTop: 6,
    color: "#667386",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  sheetMembersScroll: {
    maxHeight: 360,
    marginTop: 16,
  },
  sheetMembersContent: { gap: 10, paddingBottom: 6 },
  memberRow: {
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EED8CE",
    backgroundColor: "#FFFBF8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberRowSelected: {
    borderColor: "#F56F68",
    backgroundColor: "#FFF3EF",
  },
  memberCopy: { flex: 1, minWidth: 0 },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  memberName: {
    color: "#1E2A3A",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  memberMeta: {
    marginTop: 3,
    color: "#667386",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  memberBadge: {
    minHeight: 24,
    borderRadius: 999,
    backgroundColor: "#FFE4DD",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  memberBadgeText: {
    color: "#F56F68",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  memberCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8C4B9",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  memberCheckSelected: {
    borderColor: "#F56F68",
    backgroundColor: "#F56F68",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  sheetSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8D8D0",
    backgroundColor: "#FFFCF8",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSecondaryButtonText: {
    color: "#1E2A3A",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  sheetPrimaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#F56F68",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryButtonDisabled: {
    opacity: 0.65,
  },
  sheetPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});
