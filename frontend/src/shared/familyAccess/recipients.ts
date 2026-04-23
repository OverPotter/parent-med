import type { FamilyAccessPolicy } from "../types/api.js";
import {
  canReceiveIllnessSignalsForChild,
  getCabinetAccessLevel,
  getPillboxAccessLevel,
} from "./policy.js";

export type FamilyMemberRecipientLike = {
  id: string;
  familyRole?: string | null;
  accessPolicy?: FamilyAccessPolicy | null;
};

export function getEligibleIllnessRecipients<TMember extends FamilyMemberRecipientLike>(
  members: TMember[],
  childId: string
) {
  return members.filter((member) =>
    canReceiveIllnessSignalsForChild(member.accessPolicy, childId)
  );
}

export function getEligiblePillboxRecipients<TMember extends FamilyMemberRecipientLike>(
  members: TMember[]
) {
  return members.filter((member) => getPillboxAccessLevel(member.accessPolicy) !== "none");
}

export function getEligibleCabinetRecipients<TMember extends FamilyMemberRecipientLike>(
  members: TMember[]
) {
  return members.filter((member) => getCabinetAccessLevel(member.accessPolicy) !== "none");
}
