import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Share,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  createMobileFamilyInvite,
  type MobileFamilyMember,
  updateMobileFamilyMember,
} from "../api/familyMembersApi";
import type { ChildCard } from "../../children/model/childrenRedesign";
import {
  buildFamilyMemberPermissions,
  buildFamilyStateFromData,
  buildFamilyScreenContent,
  type FamilyUiAccessPolicy,
} from "../model/familyScreen";
import {
  FamilyMemberActionSheet,
  FamilyOverviewContent,
  FamilyAccessContent,
  FamilyProfileEditContent,
} from "./FamilyScreenContent";
import { FamilyOverlayScaffold } from "./FamilyOverlayScaffold";
import {
  cabinetAccessOptionLabel,
  childrenAccessOptionLabel,
  FamilyTitleIcon,
  getRoleBadgeTone,
  getRoleLabel,
  getStatTone,
  MemberRow,
  palette,
  pillboxAccessOptionLabel,
} from "./FamilyScreenParts";

type FamilyScreenProps = {
  visible: boolean;
  onBack: () => void;
  onOpenChildren: () => void;
  onOpenPillbox: () => void;
  onRefreshFamilyMembers: () => Promise<void>;
  onUpdateCurrentProfile: (patch: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<void>;
  canInviteMembers: boolean;
  familyMembers: MobileFamilyMember[];
  routinesCount: number;
  childrenCards: ChildCard[];
  session: MobileAuthSession;
};

type FamilyProfileEditDraft = {
  memberId: string;
  name: string;
  relationship: string;
  phone: string;
};

export function FamilyScreen({
  visible,
  onBack,
  onOpenChildren,
  onOpenPillbox,
  onRefreshFamilyMembers,
  onUpdateCurrentProfile,
  canInviteMembers,
  familyMembers,
  routinesCount,
  childrenCards,
  session,
}: FamilyScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = useMemo(() => buildFamilyScreenContent(locale), [locale]);
  const initialState = useMemo(
    () =>
      buildFamilyStateFromData({
        locale,
        session,
        familyMembers,
        childrenCards,
        routinesCount,
      }),
    [childrenCards, familyMembers, locale, routinesCount, session],
  );
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const stackInviteButtons = width < 370;
  const scrollViewRef = useRef<ScrollView | null>(null);
  const copyToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const membersSectionYRef = useRef(0);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberActionMemberId, setMemberActionMemberId] = useState<string | null>(
    null,
  );
  const [profileEditDraft, setProfileEditDraft] = useState<FamilyProfileEditDraft | null>(
    null,
  );
  const [accessDraft, setAccessDraft] = useState<FamilyUiAccessPolicy | null>(
    null,
  );
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  useEffect(() => {
    if (visible) {
      return;
    }

    setInviteCopied(false);
    setInviteCode(null);
    setInviteExpanded(false);
    setSelectedMemberId(null);
    setMemberActionMemberId(null);
    setProfileEditDraft(null);
    setAccessDraft(null);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

  const familyState = initialState;
  const currentMember =
    familyState.members.find((member) => member.isCurrentUser) ??
    familyState.members[0];
  const selectedMember =
    familyState.members.find((member) => member.id === selectedMemberId) ?? null;
  const actionMember =
    familyState.members.find((member) => member.id === memberActionMemberId) ?? null;
  const memberPermissions =
    currentMember && selectedMember
      ? buildFamilyMemberPermissions({
          members: familyState.members,
          currentMember,
          targetMember: selectedMember,
        })
      : null;
  const actionMemberPermissions =
    currentMember && actionMember
      ? buildFamilyMemberPermissions({
          members: familyState.members,
          currentMember,
          targetMember: actionMember,
        })
      : null;
  const ownerTone = getRoleBadgeTone(currentMember.role);

  const rootSwipe = useEdgeSwipeBack({
    enabled: visible,
    width,
    onBack,
    captureWidth: 12,
  });
  const accessSwipe = useEdgeSwipeBack({
    enabled: visible && selectedMember !== null && accessDraft !== null,
    width,
    captureWidth: 12,
    onBack: () => {
      setSelectedMemberId(null);
      setMemberActionMemberId(null);
      setProfileEditDraft(null);
      setAccessDraft(null);
    },
  });
  const profileEditSwipe = useEdgeSwipeBack({
    enabled: visible && profileEditDraft !== null,
    width,
    captureWidth: 12,
    onBack: () => {
      setProfileEditDraft(null);
      setSelectedMemberId(null);
    },
  });

  const roleRules = [
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
  ] as const;
  const stats = [
    {
      key: "adults" as const,
      value: familyState.adultsCount,
      label: content.adultsLabel,
      tone: getStatTone("adults"),
    },
    {
      key: "children" as const,
      value: familyState.childrenCount,
      label: content.childrenLabel,
      tone: getStatTone("children"),
    },
    {
      key: "routines" as const,
      value: familyState.routinesCount,
      label: content.routinesLabel,
      tone: getStatTone("routines"),
    },
  ];

  const handleCopyInvite = () => {
    if (!inviteCode) {
      return;
    }

    void Clipboard.setStringAsync(inviteCode);
    if (copyToastTimeoutRef.current) {
      clearTimeout(copyToastTimeoutRef.current);
    }
    setInviteCopied(true);
    copyToastTimeoutRef.current = setTimeout(() => {
      setInviteCopied(false);
      copyToastTimeoutRef.current = null;
    }, 2200);
  };

  const handleShareInvite = () => {
    if (!inviteCode) {
      return;
    }

    void Share.share({
      message: content.shareInviteMessage(inviteCode),
    });
  };

  const showFamilyRequestError = (title: string, error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : content.genericActionError;

    Alert.alert(title, message);
  };

  const handleRefreshInviteCode = async () => {
    if (isCreatingInvite) {
      return;
    }

    setIsCreatingInvite(true);
    try {
      const nextInvite = await createMobileFamilyInvite({
        accessToken: session.accessToken,
        familyRole: "member",
      });
      setInviteCode(nextInvite.token);
      setInviteCopied(false);
      setInviteExpanded(true);
    } catch (error) {
      showFamilyRequestError(content.createInviteErrorTitle, error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleOpenMemberActions = (memberId: string) => {
    setMemberActionMemberId(memberId);
  };

  const handleStartAccessForMember = (memberId: string) => {
    const member = familyState.members.find((item) => item.id === memberId);

    if (!member) {
      return;
    }

    setSelectedMemberId(member.id);
    setProfileEditDraft(null);
    setAccessDraft({ ...member.accessPolicy });
  };

  const handleStartProfileEditForMember = (memberId: string) => {
    const member = familyState.members.find((item) => item.id === memberId);

    if (!member?.isCurrentUser) {
      return;
    }

    setSelectedMemberId(null);
    setAccessDraft(null);
    setProfileEditDraft({
      memberId: member.id,
      name: member.name,
      relationship: member.relationship,
      phone: member.phone ?? "",
    });
  };

  const updateAccessDraft = (nextPolicy: FamilyUiAccessPolicy) => {
    setAccessDraft(nextPolicy);
  };

  const handleSaveAccess = async () => {
    if (!selectedMemberId || !accessDraft || isSavingAccess) {
      return;
    }

    setIsSavingAccess(true);
    try {
      await updateMobileFamilyMember({
        accessToken: session.accessToken,
        memberAccountId: selectedMemberId,
        accessPolicy: accessDraft,
      });

      setSelectedMemberId(null);
      setMemberActionMemberId(null);
      setAccessDraft(null);
      await onRefreshFamilyMembers();
    } catch (error) {
      showFamilyRequestError(content.saveAccessErrorTitle, error);
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleSaveProfileEdit = async () => {
    if (!profileEditDraft || isSavingProfile) {
      return;
    }

    const trimmedName = profileEditDraft.name.trim();
    const trimmedRelationship = profileEditDraft.relationship.trim();
    const trimmedPhone = profileEditDraft.phone.trim();

    setIsSavingProfile(true);
    try {
      await onUpdateCurrentProfile({
        displayName: trimmedName || undefined,
        relationshipLabel: trimmedRelationship || null,
        phone: trimmedPhone || null,
      });

      setProfileEditDraft(null);
      setSelectedMemberId(null);
      await onRefreshFamilyMembers();
    } catch (error) {
      showFamilyRequestError(content.saveProfileErrorTitle, error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePressFamilyStat = (key: "adults" | "children" | "routines") => {
    if (key === "children") {
      onOpenChildren();
      return;
    }

    if (key === "routines") {
      onOpenPillbox();
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(membersSectionYRef.current - 96, 0),
      animated: true,
    });
  };

  const renderOverview = () => (
    <View
      onLayout={(event) => {
        membersSectionYRef.current = event.nativeEvent.layout.y;
      }}
    >
      <FamilyOverviewContent
        compact={isCompact}
        content={content}
        currentMemberRoleLabel={getRoleLabel(content, currentMember.role)}
        familyName={session.family.name}
        inviteCode={inviteCode}
        inviteCopied={inviteCopied}
        inviteExpanded={inviteExpanded}
        showInviteCard={canInviteMembers}
        memberRows={familyState.members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            content={content}
            isLast={index === familyState.members.length - 1}
            onPressAction={() => handleOpenMemberActions(member.id)}
          />
        ))}
        onCopyInvite={handleCopyInvite}
        onPressFamilyStat={handlePressFamilyStat}
        onRefreshInviteCode={handleRefreshInviteCode}
        onShareInvite={handleShareInvite}
        onToggleInviteExpanded={() => setInviteExpanded((current) => !current)}
        ownerTone={ownerTone}
        palette={palette}
        renderFamilyTitleIcon={<FamilyTitleIcon />}
        roleRules={roleRules}
        stackInviteButtons={stackInviteButtons}
        stats={stats}
        subtitleColor={surfaceTheme.textSecondaryColor}
        titleColor={surfaceTheme.textPrimaryColor}
      />
    </View>
  );

  return (
    <FamilyOverlayScaffold
      backLabel={content.backLabel}
      onBack={onBack}
      overlayChildren={
        <>
          {selectedMember && accessDraft ? (
            <FamilyOverlayScaffold
              backLabel={selectedMember.name}
              backgroundOverlayVisible={false}
              onBack={() => {
                setSelectedMemberId(null);
                setMemberActionMemberId(null);
                setProfileEditDraft(null);
                setAccessDraft(null);
              }}
              panHandlers={accessSwipe.panHandlers}
              swipeCaptureWidth={accessSwipe.swipeCaptureWidth}
              textColor={surfaceTheme.textSecondaryColor}
              translateX={accessSwipe.translateX}
            >
              <FamilyAccessContent
                cabinetAccessLabels={{
                  none: cabinetAccessOptionLabel(locale, "none"),
                  view: cabinetAccessOptionLabel(locale, "view"),
                  edit: cabinetAccessOptionLabel(locale, "edit"),
                }}
                children={familyState.children}
                childrenAccessLabels={{
                  none: childrenAccessOptionLabel(locale, "none"),
                  view: childrenAccessOptionLabel(locale, "view"),
                  act: childrenAccessOptionLabel(locale, "act"),
                  edit: childrenAccessOptionLabel(locale, "edit"),
                }}
                content={content}
                memberName={selectedMember.name}
                memberRelationship={selectedMember.relationship}
                onChangePolicy={updateAccessDraft}
                onSave={handleSaveAccess}
                palette={palette}
                pillboxAccessLabels={{
                  none: pillboxAccessOptionLabel(locale, "none"),
                  view: pillboxAccessOptionLabel(locale, "view"),
                  act: pillboxAccessOptionLabel(locale, "act"),
                  edit: pillboxAccessOptionLabel(locale, "edit"),
                }}
                policy={accessDraft}
              />
            </FamilyOverlayScaffold>
          ) : null}
          {profileEditDraft ? (
            <FamilyOverlayScaffold
              backLabel={selectedMember?.name ?? content.title}
              backgroundOverlayVisible={false}
              onBack={() => setProfileEditDraft(null)}
              panHandlers={profileEditSwipe.panHandlers}
              swipeCaptureWidth={profileEditSwipe.swipeCaptureWidth}
              textColor={surfaceTheme.textSecondaryColor}
              translateX={profileEditSwipe.translateX}
            >
              <FamilyProfileEditContent
                content={content}
                draft={profileEditDraft}
                onChangeDraft={setProfileEditDraft}
                onSave={handleSaveProfileEdit}
                palette={palette}
              />
            </FamilyOverlayScaffold>
          ) : null}
          {actionMember ? (
            <FamilyMemberActionSheet
              content={content}
              memberName={actionMember.name}
              canEditProfile={Boolean(actionMemberPermissions?.canEditProfile)}
              canManageAccess={Boolean(actionMemberPermissions?.canManageAccess)}
              onClose={() => setMemberActionMemberId(null)}
              onEditProfile={() => handleStartProfileEditForMember(actionMember.id)}
              onManageAccess={() => handleStartAccessForMember(actionMember.id)}
              visible
            />
          ) : null}
        </>
      }
      panHandlers={rootSwipe.panHandlers}
      pointerEvents={visible ? "auto" : "none"}
      scrollViewRef={scrollViewRef}
      swipeCaptureWidth={rootSwipe.swipeCaptureWidth}
      textColor={surfaceTheme.textSecondaryColor}
      translateX={rootSwipe.translateX}
      visible={visible}
    >
      {renderOverview()}
    </FamilyOverlayScaffold>
  );
}
