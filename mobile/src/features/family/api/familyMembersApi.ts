import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "../../illness/api/illnessApiClient";
import { normalizeMobileLocale, type MobileLocale } from "../../../shared/i18n/mobileI18n";

type RawMobileFamilyAccessPolicy = {
  all_children?: boolean;
  child_ids?: string[] | null;
  children_access?: "view" | "act" | "edit";
  cabinet_access?: "none" | "view" | "edit";
  pillbox_access?: "none" | "view" | "act" | "edit";
  cabinet_push_enabled?: boolean;
} | null;

type RawMobileFamilyMemberResponse = {
  id: string;
  email: string | null;
  family_id: string;
  display_name: string;
  relationship_label: string | null;
  phone: string | null;
  preferred_language?: MobileLocale | null;
  family_role: string;
  access_policy?: RawMobileFamilyAccessPolicy;
};

type RawMobileFamilyInviteResponse = {
  token: string;
  family_id: string;
  family_name: string;
  family_role: string;
  expires_at: string;
};

export type MobileFamilyAccessPolicy = {
  allChildren: boolean;
  childIds: string[];
  childrenAccess: "view" | "act" | "edit";
  cabinetAccess: "none" | "view" | "edit";
  pillboxAccess: "none" | "view" | "act" | "edit";
  cabinetPushEnabled: boolean;
};

export type MobileFamilyMember = {
  id: string;
  email: string | null;
  familyId: string;
  displayName: string;
  relationshipLabel: string | null;
  phone: string | null;
  preferredLanguage: MobileLocale;
  familyRole: string;
  accessPolicy: MobileFamilyAccessPolicy;
};

export type MobileFamilyInvite = {
  token: string;
  familyId: string;
  familyName: string;
  familyRole: string;
  expiresAt: string;
};

export class MobileFamilyMembersApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileFamilyMembersApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

const DEFAULT_FAMILY_ACCESS_POLICY: MobileFamilyAccessPolicy = {
  allChildren: false,
  childIds: [],
  childrenAccess: "view",
  cabinetAccess: "none",
  pillboxAccess: "none",
  cabinetPushEnabled: false,
};

function toMobileFamilyAccessPolicy(
  raw: RawMobileFamilyAccessPolicy,
): MobileFamilyAccessPolicy {
  if (!raw) {
    return DEFAULT_FAMILY_ACCESS_POLICY;
  }

  const allChildren = Boolean(raw.all_children);

  return {
    allChildren,
    childIds: allChildren ? [] : raw.child_ids ?? [],
    childrenAccess: raw.children_access ?? "view",
    cabinetAccess: raw.cabinet_access ?? "none",
    pillboxAccess: raw.pillbox_access ?? "none",
    cabinetPushEnabled: raw.cabinet_push_enabled ?? false,
  };
}

function toMobileFamilyMember(
  raw: RawMobileFamilyMemberResponse,
): MobileFamilyMember {
  return {
    id: raw.id,
    email: raw.email,
    familyId: raw.family_id,
    displayName: raw.display_name,
    relationshipLabel: raw.relationship_label ?? null,
    phone: raw.phone ?? null,
    preferredLanguage: normalizeMobileLocale(raw.preferred_language),
    familyRole: raw.family_role,
    accessPolicy: toMobileFamilyAccessPolicy(raw.access_policy ?? null),
  };
}

export async function fetchMobileFamilyMembers(
  session: Pick<MobileAuthSession, "accessToken">,
): Promise<MobileFamilyMember[]> {
  const response = await requestIllnessAuthedJson<RawMobileFamilyMemberResponse[]>(
    "/families/me/members",
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileFamilyMembersApiError(message, options),
  );

  return response.map(toMobileFamilyMember);
}

export async function updateMobileFamilyMember(payload: {
  accessToken: string | null;
  memberAccountId: string;
  familyRole?: "admin" | "member";
  accessPolicy?: {
    allChildren?: boolean;
    childIds?: string[];
    childrenAccess?: "none" | "view" | "act" | "edit";
    cabinetAccess?: "none" | "view" | "edit";
    pillboxAccess?: "none" | "view" | "act" | "edit";
    cabinetPushEnabled?: boolean;
  };
}): Promise<MobileFamilyMember> {
  const response = await requestIllnessAuthedJson<RawMobileFamilyMemberResponse>(
    `/families/me/members/${payload.memberAccountId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        family_role: payload.familyRole,
        access_policy: payload.accessPolicy
          ? {
              all_children:
                payload.accessPolicy.childrenAccess === "none"
                  ? false
                  : payload.accessPolicy.allChildren,
              child_ids:
                payload.accessPolicy.childrenAccess === "none"
                  ? []
                  : payload.accessPolicy.childIds,
              children_access:
                payload.accessPolicy.childrenAccess === "none"
                  ? "view"
                  : payload.accessPolicy.childrenAccess,
              cabinet_access: payload.accessPolicy.cabinetAccess,
              pillbox_access: payload.accessPolicy.pillboxAccess,
              cabinet_push_enabled: payload.accessPolicy.cabinetPushEnabled,
            }
          : undefined,
      }),
    },
    payload.accessToken,
    (message, options) => new MobileFamilyMembersApiError(message, options),
  );

  return toMobileFamilyMember(response);
}

export async function createMobileFamilyInvite(payload: {
  accessToken: string | null;
  familyRole?: "member";
}): Promise<MobileFamilyInvite> {
  const response = await requestIllnessAuthedJson<RawMobileFamilyInviteResponse>(
    "/family-invites",
    {
      method: "POST",
      body: JSON.stringify({
        family_role: payload.familyRole ?? "member",
      }),
    },
    payload.accessToken,
    (message, options) => new MobileFamilyMembersApiError(message, options),
  );

  return {
    token: response.token,
    familyId: response.family_id,
    familyName: response.family_name,
    familyRole: response.family_role,
    expiresAt: response.expires_at,
  };
}
