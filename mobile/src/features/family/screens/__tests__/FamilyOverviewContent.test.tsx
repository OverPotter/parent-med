import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { View } from "react-native";
import { MobileI18nProvider } from "../../../../shared/i18n/mobileI18n";
import { buildFamilyScreenContent } from "../../model/familyScreen";
import { palette, getRoleBadgeTone, getStatTone } from "../FamilyScreenParts";
import { FamilyOverviewContent } from "../FamilyScreenContent";

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "ru-RU", languageCode: "ru" }]),
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
  MaterialCommunityIcons: "MaterialCommunityIcons",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

function renderOverview(
  props?: Partial<React.ComponentProps<typeof FamilyOverviewContent>>,
) {
  const content = buildFamilyScreenContent("ru");

  return render(
    <MobileI18nProvider>
      <FamilyOverviewContent
        compact={false}
        content={content}
        currentMemberRoleLabel={content.ownerRoleLabel}
        familyName="Care Family"
        inviteCode="ABC12345"
        inviteCopied={false}
        inviteExpanded={false}
        inviteLocked
        joinFamilyCode=""
        joinFamilyError={null}
        joinFamilyPreviewName={null}
        joinFamilySuccessMessage={null}
        joinFamilySubmitting={false}
        joinFamilyVerifying={false}
        showInviteCard
        showJoinFamilyCard={false}
        memberRows={<View />}
        onAcceptJoinFamilyCode={jest.fn()}
        onChangeJoinFamilyCode={jest.fn()}
        onCopyInvite={jest.fn()}
        onPressFamilyStat={jest.fn()}
        onRefreshInviteCode={jest.fn()}
        onShareInvite={jest.fn()}
        onVerifyJoinFamilyCode={jest.fn()}
        onToggleInviteExpanded={jest.fn()}
        ownerTone={getRoleBadgeTone("owner")}
        palette={palette}
        renderFamilyTitleIcon={<View />}
        roleRules={[
          {
            key: "owner",
            title: content.ownerRoleLabel,
            description: content.roleRuleOwnerDescription,
            icon: "crown-outline",
            bg: palette.goldBg,
            color: palette.goldIcon,
          },
          {
            key: "admin",
            title: content.adminRoleLabel,
            description: content.roleRuleAdminDescription,
            icon: "shield-account-outline",
            bg: palette.blueBg,
            color: palette.blueIcon,
          },
          {
            key: "member",
            title: content.memberRoleLabel,
            description: content.roleRuleMemberDescription,
            icon: "account-group-outline",
            bg: palette.greenBg,
            color: palette.greenIcon,
          },
        ]}
        stackInviteButtons={false}
        stats={[
          {
            key: "adults",
            value: 2,
            label: content.adultsLabel,
            tone: getStatTone("adults"),
          },
          {
            key: "children",
            value: 1,
            label: content.childrenLabel,
            tone: getStatTone("children"),
          },
          {
            key: "routines",
            value: 3,
            label: content.routinesLabel,
            tone: getStatTone("routines"),
          },
        ]}
        subtitleColor={palette.textSecondary}
        titleColor={palette.textPrimary}
        {...props}
      />
    </MobileI18nProvider>,
  );
}

describe("FamilyOverviewContent", () => {
  it("shows Plus badge and routes locked invite tap to refresh/paywall handler", () => {
    const onRefreshInviteCode = jest.fn();
    const onToggleInviteExpanded = jest.fn();
    const screen = renderOverview({
      onRefreshInviteCode,
      onToggleInviteExpanded,
    });

    expect(screen.getByText("Plus")).toBeTruthy();
    expect(screen.getByText("Приглашения в семью доступны в Plus.")).toBeTruthy();

    fireEvent.press(screen.getByText("Код приглашения"));

    expect(onRefreshInviteCode).toHaveBeenCalledTimes(1);
    expect(onToggleInviteExpanded).not.toHaveBeenCalled();
  });
});
