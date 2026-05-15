import { buildFamilyMemberPermissions, buildFamilyStateFromData } from "../familyScreen";
import type { MobileAuthSession } from "../../../auth/api/authApi";
import type { MobileFamilyMember } from "../../api/familyMembersApi";
import type { ChildCard } from "../../../children/model/childrenRedesign";

const session: MobileAuthSession = {
  tokenType: "Bearer",
  accessToken: "token",
  refreshToken: "refresh",
  account: {
    id: "owner-1",
    email: "owner@example.com",
    familyId: "family-1",
    displayName: "Анна",
    needsProfileCompletion: false,
    familyRole: "owner",
    preferredLanguage: "ru",
    relationshipLabel: "Мама",
    phone: "+375 29 000-00-01",
    hasRecoveryCode: true,
  },
  family: {
    id: "family-1",
    name: "The best family",
    ownerAccountId: "owner-1",
  },
};

const familyMembers: MobileFamilyMember[] = [
  {
    id: "owner-1",
    email: "owner@example.com",
    familyId: "family-1",
    displayName: "Анна",
    relationshipLabel: "Мама",
    phone: "+375 29 000-00-01",
    preferredLanguage: "ru",
    familyRole: "owner",
    accessPolicy: {
      allChildren: true,
      childIds: [],
      childrenAccess: "edit",
      cabinetAccess: "edit",
      pillboxAccess: "edit",
      cabinetPushEnabled: true,
    },
  },
  {
    id: "member-2",
    email: "dad@example.com",
    familyId: "family-1",
    displayName: "Иван",
    relationshipLabel: "Папа",
    phone: "+375 29 000-00-02",
    preferredLanguage: "ru",
    familyRole: "member",
    accessPolicy: {
      allChildren: false,
      childIds: ["child-1"],
      childrenAccess: "act",
      cabinetAccess: "view",
      pillboxAccess: "act",
      cabinetPushEnabled: false,
    },
  },
];

const childrenCards: ChildCard[] = [
  {
    nodeId: "child-card-1",
    name: "Мила",
    stats: "",
    child: {
      id: "child-1",
      name: "Мила",
      ageLabel: null,
      weightValue: "",
      heightValue: "",
      birthDate: null,
      babyModeEnabled: false,
      avatarKey: null,
      gender: null,
      allergies: null,
      notes: null,
    },
    avatarSource: null,
    quickActions: [],
  },
];

describe("familyScreen model", () => {
  it("builds family state from real family members and children", () => {
    const state = buildFamilyStateFromData({
      locale: "ru",
      session,
      familyMembers,
      childrenCards,
      routinesCount: 6,
    });

    expect(state.members).toHaveLength(2);
    expect(state.members[0]).toMatchObject({
      id: "owner-1",
      name: "Анна",
      relationship: "Мама",
      role: "owner",
      isCurrentUser: true,
    });
    expect(state.members[1]).toMatchObject({
      id: "member-2",
      name: "Иван",
      relationship: "Папа",
      role: "member",
    });
    expect(state.children).toEqual([{ id: "child-1", name: "Мила" }]);
    expect(state.childrenCount).toBe(1);
    expect(state.adultsCount).toBe(2);
    expect(state.routinesCount).toBe(6);
  });

  it("falls back to current account when family members are unavailable", () => {
    const state = buildFamilyStateFromData({
      locale: "ru",
      session,
      familyMembers: [],
      childrenCards: [],
    });

    expect(state.members).toHaveLength(1);
    expect(state.members[0]).toMatchObject({
      id: "owner-1",
      name: "Анна",
      role: "owner",
      isCurrentUser: true,
    });
  });

  it("keeps access and edit permissions scoped correctly", () => {
    const state = buildFamilyStateFromData({
      locale: "ru",
      session,
      familyMembers,
      childrenCards,
    });

    const currentMember = state.members[0];
    const targetMember = state.members[1];
    const permissions = buildFamilyMemberPermissions({
      members: state.members,
      currentMember,
      targetMember,
    });

    expect(permissions.canManageAccess).toBe(true);
    expect(permissions.canEditProfile).toBe(false);
  });
});
