import { LiveActivityRuntimeSync } from "@/app/live-activities/sync";
import { MobilePageResumeSync, PullToRefreshSync } from "@/app/mobile/runtime";
import { NativePushNavigationSync, PushSubscriptionSync } from "@/app/push/sync";
import { OfflineCareSync } from "@shared/utils/offlineCareSync";

type ClientRuntimeMountProps = {
  enabled: boolean;
};

export function ClientRuntimeMount({ enabled }: ClientRuntimeMountProps) {
  if (!enabled) {
    return null;
  }

  return (
    <>
      <PushSubscriptionSync />
      <NativePushNavigationSync />
      <OfflineCareSync />
      <LiveActivityRuntimeSync />
      <MobilePageResumeSync />
      <PullToRefreshSync />
    </>
  );
}
