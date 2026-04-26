import axios from "axios";

export function isNetworkUnavailableError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return false;
}

export function hasNetworkUnavailableError(errors: unknown[]): boolean {
  return errors.some((error) => isNetworkUnavailableError(error));
}
