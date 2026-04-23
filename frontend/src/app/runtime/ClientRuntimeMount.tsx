import { LiveActivityRuntimeSync } from "@/app/live-activities/sync";
import { MobilePageResumeSync, PullToRefreshSync } from "@/app/mobile/runtime";
import { PushSubscriptionSync } from "@/app/push/sync";
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
      <OfflineCareSync />
      <LiveActivityRuntimeSync />
      <MobilePageResumeSync />
      <PullToRefreshSync />
    </>
  );
}
