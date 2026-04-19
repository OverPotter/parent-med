import { createContext, useContext } from "react";

type PushPromptControlContextValue = {
  showNotificationBell: boolean;
  isNotificationBellActive: boolean;
  onNotificationBellClick: (() => void) | null;
};

const PushPromptControlContext = createContext<PushPromptControlContextValue>({
  showNotificationBell: false,
  isNotificationBellActive: false,
  onNotificationBellClick: null,
});

export function PushPromptControlProvider({
  value,
  children,
}: {
  value: PushPromptControlContextValue;
  children: React.ReactNode;
}) {
  return (
    <PushPromptControlContext.Provider value={value}>{children}</PushPromptControlContext.Provider>
  );
}

export function usePushPromptControls() {
  return useContext(PushPromptControlContext);
}
