import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "./illnessApiClient";

type RawIllnessCommentResponse = {
  id: string;
  episode_id: string;
  created_at: string;
  text: string;
  created_by_account_id: string | null;
  created_by_name_snapshot: string | null;
};

export type MobileIllnessComment = {
  id: string;
  episodeId: string;
  createdAt: string;
  text: string;
  createdByAccountId: string | null;
  createdByNameSnapshot: string | null;
};

export class MobileIllnessCommentsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileIllnessCommentsApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileIllnessComment(
  raw: RawIllnessCommentResponse,
): MobileIllnessComment {
  return {
    id: raw.id,
    episodeId: raw.episode_id,
    createdAt: raw.created_at,
    text: raw.text,
    createdByAccountId: raw.created_by_account_id,
    createdByNameSnapshot: raw.created_by_name_snapshot,
  };
}

export async function fetchMobileIllnessCommentsByEpisodeId(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileIllnessComment[]> {
  const response = await requestIllnessAuthedJson<RawIllnessCommentResponse[]>(
    `/illness-comments?episode_id=${encodeURIComponent(episodeId)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileIllnessCommentsApiError(message, options),
  );

  return response.map(toMobileIllnessComment);
}

export async function createMobileIllnessComment(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    episodeId: string;
    text: string;
    createdAt?: string | null;
  },
): Promise<MobileIllnessComment> {
  const response = await requestIllnessAuthedJson<RawIllnessCommentResponse>(
    "/illness-comments",
    {
      method: "POST",
      body: JSON.stringify({
        episode_id: payload.episodeId,
        text: payload.text,
        created_at: payload.createdAt ?? null,
      }),
    },
    session.accessToken,
    (message, options) => new MobileIllnessCommentsApiError(message, options),
  );

  return toMobileIllnessComment(response);
}

export async function deleteMobileIllnessComment(
  session: Pick<MobileAuthSession, "accessToken">,
  commentId: string,
): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/illness-comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE" },
    session.accessToken,
    (message, options) => new MobileIllnessCommentsApiError(message, options),
  );
}
