/**
 * Имена событий HitKeep (custom events). Должны совпадать с Goals в дашборде.
 */

export const AnalyticsEvents = {
  PAGE_VIEW: "pm_page_view",
  SESSION_IDENTIFY: "pm_session_identify",
  AUTH_LOGIN_SUCCESS: "pm_auth_login_success",
  AUTH_REGISTER_SUCCESS: "pm_auth_register_success",
  AUTH_ERROR: "pm_auth_error",
  START_ROUTE_RESOLVED: "pm_start_route_resolved",
  WORKSPACE_INTRO_COMPLETED: "pm_workspace_intro_completed",
  CHILD_CREATED: "pm_child_created",
  HOUSEHOLD_MEDICINE_ADDED: "pm_household_medicine_added",
  ILLNESS_EPISODE_STARTED: "pm_illness_episode_started",
  TEMPERATURE_LOGGED: "pm_temperature_logged",
  MEDICATION_ADMINISTERED: "pm_medication_administered",
  FAMILY_INVITE_ACCEPTED: "pm_family_invite_accepted",
} as const;
