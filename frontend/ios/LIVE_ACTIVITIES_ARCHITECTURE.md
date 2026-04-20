# Live Activities Architecture

Current scaffold:

- `CapApp-SPM/Sources/CapApp-SPM/LiveActivitiesPlugin.swift`
  Capacitor bridge with `getStatus`, `upsert`, `stop`, `stopAll`.
- `CapApp-SPM/Sources/CapApp-SPM/LiveActivitiesManager.swift`
  ActivityKit coordinator for local start/update/stop.
- `CapApp-SPM/Sources/CapApp-SPM/LiveActivitiesModels.swift`
  Shared ActivityKit attributes and payload models.

Frontend wiring:

- `src/shared/utils/nativeLiveActivities.ts`
  JS bridge for the native plugin.
- `src/shared/utils/liveActivities.ts`
  app-level helpers for sleep/feeding sync and preference-aware stopping.
- `src/app/live-activities/sync.tsx`
  runtime reconciliation on boot, focus and preference changes.

Still required for fully visible iPhone Live Activities:

- add a Widget Extension target in Xcode
- reuse `kind`, `title`, `subtitle`, `startedAt`, `deepLink` to render the lock-screen / Dynamic Island UI
- expose tappable deep links from the widget extension
- optionally add remote-update support later if server-driven Live Activity updates are needed
