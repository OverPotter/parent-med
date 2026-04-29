type PaywallLegalRouteState = {
  fromPaywall: true;
  paywallReturnTo?: string;
};

export function isPaywallLegalRouteState(state: unknown): state is PaywallLegalRouteState {
  return typeof state === "object" && state !== null && "fromPaywall" in state;
}

export function getPaywallLegalRouteState(state: unknown): PaywallLegalRouteState | undefined {
  if (!isPaywallLegalRouteState(state)) {
    return undefined;
  }

  return {
    fromPaywall: true,
    ...(typeof state.paywallReturnTo === "string" ? { paywallReturnTo: state.paywallReturnTo } : {}),
  };
}

export function getPaywallReturnTo(state: unknown): string | null {
  if (!isPaywallLegalRouteState(state) || typeof state.paywallReturnTo !== "string") {
    return null;
  }

  return state.paywallReturnTo;
}
