/**
 * API: обратная связь.
 */

import { apiClient } from "./client";

export interface AccountFeedbackResponse {
  id: string;
  account_id: string;
  message: string;
  client_request_id: string;
  created_at: string;
}

export interface PublicSupportRequestResponse {
  id: string;
  reply_contact: string;
  message: string;
  client_request_id: string;
  created_at: string;
}

export async function submitFeedback(payload: {
  message: string;
  client_request_id: string;
}): Promise<AccountFeedbackResponse> {
  const res = await apiClient.post<AccountFeedbackResponse>("/feedback", payload);
  return res.data;
}

export async function submitPublicSupportRequest(payload: {
  reply_contact: string;
  message: string;
  client_request_id: string;
}): Promise<PublicSupportRequestResponse> {
  const res = await apiClient.post<PublicSupportRequestResponse>("/public-support", payload);
  return res.data;
}
