import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "../../illness/api/illnessApiClient";

type RawCabinetFamilyResponse = {
  id: string;
  name: string;
  owner_account_id?: string | null;
  cabinet_member_account_ids?: string[] | null;
};

export type MobileCabinetFamily = {
  id: string;
  name: string;
  ownerAccountId: string | null;
  cabinetMemberAccountIds: string[];
};

export class MobileCabinetRecipientsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileCabinetRecipientsApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileCabinetFamily(
  raw: RawCabinetFamilyResponse,
): MobileCabinetFamily {
  return {
    id: raw.id,
    name: raw.name,
    ownerAccountId: raw.owner_account_id ?? null,
    cabinetMemberAccountIds: raw.cabinet_member_account_ids ?? [],
  };
}

export async function fetchMobileCabinetFamily(
  session: Pick<MobileAuthSession, "accessToken">,
): Promise<MobileCabinetFamily> {
  const response = await requestIllnessAuthedJson<RawCabinetFamilyResponse>(
    "/families/me",
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileCabinetRecipientsApiError(message, options),
  );

  return toMobileCabinetFamily(response);
}

export async function updateMobileCabinetRecipients(payload: {
  accessToken: string | null;
  memberAccountIds: string[];
}): Promise<MobileCabinetFamily> {
  const response = await requestIllnessAuthedJson<RawCabinetFamilyResponse>(
    "/families/me",
    {
      method: "PATCH",
      body: JSON.stringify({
        cabinet_member_account_ids: payload.memberAccountIds,
      }),
    },
    payload.accessToken,
    (message, options) => new MobileCabinetRecipientsApiError(message, options),
  );

  return toMobileCabinetFamily(response);
}
