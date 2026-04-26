import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteFamilyMember,
  canDemoteFamilyMember,
  canLeaveCurrentFamily,
  canManageFamilyMemberAccess,
  canManageFamilyMembers,
  canPromoteFamilyMember,
  isFamilyAdminAccount,
  isFamilyOwnerAccount,
} from "../src/client/pages/family/memberManagement.js";

const familyOwnerAccountId = "owner-1";
const currentAccountId = "viewer-1";
const memberAccountId = "member-1";
const adminAccountId = "admin-1";

test("owner is derived from family owner account id, not family role", () => {
  assert.equal(
    isFamilyOwnerAccount({
      familyOwnerAccountId,
      currentAccountId: familyOwnerAccountId,
    }),
    true
  );
  assert.equal(
    isFamilyOwnerAccount({
      familyOwnerAccountId,
      currentAccountId,
    }),
    false
  );
});

test("admin can manage family members but not owner capabilities", () => {
  assert.equal(
    isFamilyAdminAccount({
      familyOwnerAccountId,
      currentAccountId,
      currentAccountRole: "admin",
    }),
    true
  );
  assert.equal(
    canManageFamilyMembers({
      familyOwnerAccountId,
      currentAccountId,
      currentAccountRole: "admin",
    }),
    true
  );
});

test("owner can manage and delete admin and member, but not self", () => {
  const ownerViewer = {
    familyOwnerAccountId,
    currentAccountId: familyOwnerAccountId,
    currentAccountRole: "admin",
  } as const;

  assert.equal(
    canManageFamilyMemberAccess({
      ...ownerViewer,
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    true
  );
  assert.equal(
    canManageFamilyMemberAccess({
      ...ownerViewer,
      targetAccountId: adminAccountId,
      targetFamilyRole: "admin",
    }),
    true
  );
  assert.equal(
    canDeleteFamilyMember({
      ...ownerViewer,
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    true
  );
  assert.equal(
    canDeleteFamilyMember({
      ...ownerViewer,
      targetAccountId: adminAccountId,
      targetFamilyRole: "admin",
    }),
    true
  );
  assert.equal(
    canDeleteFamilyMember({
      ...ownerViewer,
      targetAccountId: familyOwnerAccountId,
      targetFamilyRole: "admin",
    }),
    false
  );
});

test("admin can manage only members", () => {
  const adminViewer = {
    familyOwnerAccountId,
    currentAccountId: adminAccountId,
    currentAccountRole: "admin",
  } as const;

  assert.equal(
    canManageFamilyMemberAccess({
      ...adminViewer,
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    true
  );
  assert.equal(
    canManageFamilyMemberAccess({
      ...adminViewer,
      targetAccountId: familyOwnerAccountId,
      targetFamilyRole: "admin",
    }),
    false
  );
  assert.equal(
    canManageFamilyMemberAccess({
      ...adminViewer,
      targetAccountId: "other-admin",
      targetFamilyRole: "admin",
    }),
    false
  );
  assert.equal(
    canDeleteFamilyMember({
      ...adminViewer,
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    true
  );
  assert.equal(
    canDeleteFamilyMember({
      ...adminViewer,
      targetAccountId: "other-admin",
      targetFamilyRole: "admin",
    }),
    false
  );
});

test("only owner can promote and demote admins", () => {
  assert.equal(
    canPromoteFamilyMember({
      familyOwnerAccountId,
      currentAccountId: familyOwnerAccountId,
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    true
  );
  assert.equal(
    canPromoteFamilyMember({
      familyOwnerAccountId,
      currentAccountId: adminAccountId,
      currentAccountRole: "admin",
      targetAccountId: memberAccountId,
      targetFamilyRole: "member",
    }),
    false
  );
  assert.equal(
    canDemoteFamilyMember({
      familyOwnerAccountId,
      currentAccountId: familyOwnerAccountId,
      targetAccountId: adminAccountId,
      targetFamilyRole: "admin",
      adminsCount: 2,
    }),
    true
  );
  assert.equal(
    canDemoteFamilyMember({
      familyOwnerAccountId,
      currentAccountId: familyOwnerAccountId,
      targetAccountId: adminAccountId,
      targetFamilyRole: "admin",
      adminsCount: 1,
    }),
    false
  );
});

test("leave family is allowed only for non-owner current members", () => {
  assert.equal(
    canLeaveCurrentFamily({
      familyOwnerAccountId,
      currentAccountId: adminAccountId,
      hasCurrentMember: true,
    }),
    true
  );
  assert.equal(
    canLeaveCurrentFamily({
      familyOwnerAccountId,
      currentAccountId: familyOwnerAccountId,
      hasCurrentMember: true,
    }),
    false
  );
  assert.equal(
    canLeaveCurrentFamily({
      familyOwnerAccountId,
      currentAccountId: adminAccountId,
      hasCurrentMember: false,
    }),
    false
  );
});
