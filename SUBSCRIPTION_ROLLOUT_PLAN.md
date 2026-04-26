# Subscription Rollout Plan

This is the detailed rollout/status document for subscription, downgrade, billing ownership, and related family-access rules.

For high-level project docs, use:

- [docs/APP_ARCHITECTURE.md](./docs/APP_ARCHITECTURE.md)
- [docs/DATABASE_ARCHITECTURE.md](./docs/DATABASE_ARCHITECTURE.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)

## Implementation Checklist

- [x] Create a dedicated rollout plan in the repo
- [x] Add subscription access layer on backend
- [x] Expose access payload for frontend
- [x] Enforce backend free-plan limits on owner-only invites
- [x] Enforce backend free-plan limits on child count
- [x] Enforce backend free-plan limits on pillbox plans
- [x] Add billing tables: `plans`, `subscriptions`, `billing_events`
- [x] Add stub billing flow for local development
- [x] Add initial frontend access wiring and paylocked states
- [x] Add shared paywall UX
- [x] Add downgrade-safe child access model for `Free`
- [x] Preserve active illness flows after downgrade
- [x] Add RevenueCat test integration and backend sync scaffold
- [x] Add local force-free testing mode for subscription logic
- [ ] Remove dev-only RevenueCat sandbox/testing controls before release
- [ ] Add landing pricing page
- [ ] Verify device-language auto selection on first launch
- [ ] Verify device-theme auto selection on first launch
- [ ] Evaluate adding Polish and German localizations
- [ ] Evaluate internal admin/support console for manual subscription overrides and account support

## Completed Work

- [x] Rollout document created and committed in repo
- [x] Backend subscription access layer added via `SubscriptionAccessService`
- [x] Access payload exposed via `GET /families/me/access`
- [x] Free-plan backend limits added for invites, children, and pillbox plans
- [x] Invite flow simplified to owner-only:
  - only `owner` may create/share invites
  - `admin` no longer participates in invite management
- [x] Family leave flow added:
  - `member` and `admin` may leave the current family
  - leaving keeps the same account and credentials
  - the leaving account is moved into a new empty family
  - the leaving account becomes the `owner` of that new family
  - `owner` may not use `leave family`
- [x] Billing foundation added:
  - migration `062_add_billing_foundation.py`
  - entities for `Plan`, `Subscription`, `BillingEvent`
  - SQLAlchemy models and repositories for billing tables
- [x] Local stub billing flow added:
  - `BillingService`
  - `POST /api/v1/billing/debug/apply`
  - `POST /api/v1/billing/debug/reset-free`
- [x] Initial frontend access wiring and paylocked states added:
  - frontend fetches `GET /families/me/access`
  - family invite action is locked in `Free`
  - `Live Activities` settings are locked in `Free`
  - second child creation is blocked in `Free`
  - second pillbox plan creation is blocked in `Free`
- [x] Shared upgrade flow added:
  - reusable `UpgradeDialog`
  - reusable dev upgrade hook wired to local stub billing
  - upgrade entry points connected in family, child create, pillbox, and settings
- [x] Downgrade-safe child access model added:
  - migration `063_add_free_primary_child.py`
  - `children.created_at` persisted for stable ordering
  - `families.free_primary_child_id` stores the one child that stays fully active in `Free`
  - after downgrade from `Plus`, all children remain visible
  - child-level mutations are locked only for non-primary children
- [x] Active illness continuation after downgrade added:
  - non-primary child can finish an already active illness episode after downgrade
  - new illness episode creation for non-primary child stays blocked in `Free`
  - temperature, administrations, comments, and episode medication plans stay available only while that episode is active
  - after the episode is closed, non-primary child returns to normal `Free` locked state
- [x] Provider-agnostic billing sync foundation added:
  - normalized provider sync DTO in billing service
  - shared subscription lifecycle reused for debug and future RevenueCat/App Store sync
  - `trialing` status supported end-to-end in family snapshots and premium policy
- [x] RevenueCat test/store wiring finished for development:
  - backend `provider-sync` route is added
  - frontend native RevenueCat runtime/init/sync scaffold is added
  - native iOS bridge/plugin is added and validated with Test Store purchase flow
  - local test keys are wired in env for sandbox smoke tests
  - dev-only `RevenueCat sandbox` section is added in Settings for `configure / offerings / purchase / restore / snapshot`
  - backend sync is gateable via `VITE_REVENUECAT_SYNC_BACKEND`
  - local `Force free mode` / `Resume RevenueCat sync` controls are added for repeatable downgrade testing without waiting for expiration
- [ ] Dev-only test tooling still present in the current development build and must be removed or hidden before release:
  - `Settings -> RevenueCat sandbox`
  - `Reset to free`
  - `Force free mode`
  - `Resume RevenueCat sync`
  - local RevenueCat sync suppression helpers used only for manual downgrade testing
- [x] Covered by targeted backend tests:
  - `backend/tests/test_subscription_access_service.py`
  - `backend/tests/test_family_service.py`
  - `backend/tests/test_child_service.py`
  - `backend/tests/test_family_invite_service.py`
  - `backend/tests/test_family_access_services.py`
  - `backend/tests/test_billing_service.py`
- [x] Pillbox downgrade model added:
  - migration `066_add_free_primary_pillbox_plan.py`
  - `families.free_primary_pillbox_plan_id` stores the one plan that stays operational in `Free`
  - after downgrade from `Plus`, one pillbox plan stays operational in `Free`
  - every additional active or paused plan is frozen in `paused`
  - frozen non-primary plans stay visible, but no longer allow dose logging, resume, edit, or delete in `Free`
- [x] Covered by targeted frontend tests:
  - `frontend/test/familySubscriptionAccess.test.ts`
  - `frontend/test/familyMemberManagement.test.ts`
  - `frontend/test/upgradeDialogCopy.test.ts`
  - `frontend/test/pillboxPlanAccess.test.ts`
  - `npm test -- --runInBand` passed with `85` tests
  - `npm run build` passed
- [x] UI cleanup after final role/subscription flows:
  - duplicated `Plus` badge markup removed into shared `PlusBadge`
  - pillbox free-limit visibility logic extracted into shared frontend helper
  - paywall copy tests updated to match the new product text

## Goal

Introduce `Free` and `Plus` plans without breaking the current family model.

Core principles:
- subscription is family-scoped
- only the `owner` may manage billing and invites
- subscription benefits are applied to the whole `family`
- backend is the source of truth for access
- `RevenueCat` and Apple only provide billing state
- premium features should usually be visible but locked

## Product Contract

### Free

- `1` adult
- `1` child
- `1` pillbox reminder plan
- medicine cabinet is available
- medicine database search is available
- no family invites
- no `CSV export`
- no `Live Activities`

### Plus

- everything from `Free`
- unlimited adult family members
- unlimited children
- family invites by the `owner`
- per-member access settings
- roles such as mother, father, grandmother, nanny
- plans for different family members
- collaborative use
- store who gave medicine and when
- `CSV export`
- `Live Activities`

## Downgrade Logic Matrix

This section is the source of truth for mobile downgrade behavior after `Plus` expires.

### Core Rule

- `Free` fully supports exactly one child
- after downgrade, one child remains the `free_primary_child`
- every other child stays visible, but child-level actions are restricted by the rules below

### Children Module

#### Free, normal case

- one child is fully usable
- create child, edit child, feeding, sleep, illness, measurements all work for the `free_primary_child`

#### Downgrade from Plus with more than one child

- all children remain visible
- one `free_primary_child` remains fully active
- all other children become locked for normal child-level actions
- history and read-only screens stay visible for all children

#### Locked child behavior

For non-primary children after downgrade:

- profile overview remains visible
- illness history remains visible
- weight history remains visible
- height history remains visible
- calendar / overview remains visible
- editing the profile is locked
- starting a new illness observation is locked
- starting new feeding is locked
- starting new sleep tracking is locked
- adding new weight entry is locked
- adding new height entry is locked

Implementation status:

- enforced on backend for child-scoped mutations
- enforced on frontend with paylocked UI and route guards
- visibility remains read-only for overview and history screens

### Illness Journal

#### Free, normal case

- the `free_primary_child` can start, continue, and close illness observations

#### Downgrade with active illness on a non-primary child

- an already active illness observation must not be interrupted
- the family may continue the active illness until completion
- the family may close the active illness
- inside that active illness, the following stay available:
  - temperature logging
  - administration logging
  - illness notes/comments
  - illness reminder plans inside the active episode

#### After active illness is closed on a non-primary child

- starting a new illness observation becomes locked again
- the child returns to normal non-primary `Free` locked behavior

### Feeding And Sleep

#### Downgrade with active feeding or active sleep on a non-primary child

- active feeding must be stopped
- active sleep must be stopped
- after stop, feeding and sleep actions become locked again
- this stop does not keep the child generally active
- only active illness gets continuation treatment after downgrade

Implementation status:

- enforced on backend during family subscription downgrade/snapshot sync
- active non-primary feeding is auto-finished
- active non-primary sleep is auto-finished
- frontend remains responsible for locked UI after the backend state changes

#### Why this differs from illness

- illness is a higher-priority care flow and should be allowed to finish
- feeding and sleep timers are operational trackers, not long-lived treatment flows
- therefore they are force-finished and then locked

### Summary Rules

- `free_primary_child` keeps full access
- non-primary children remain visible
- non-primary children cannot start new premium child flows
- active illness may be finished for non-primary children
- active feeding and active sleep do not get continuation rights after downgrade

### Live Activities

#### Free, normal case

- the `Live Activities` section remains visible in Settings
- if the family does not have `Plus`, all live-activity toggles render in the off state
- tapping a live-activity toggle in `Free` does not enable it and instead opens the upgrade/paywall flow

#### Downgrade from Plus

- if `Plus` expires or the family returns to `Free`, active live activities must be stopped
- sleep, feeding, and illness live activities stop across the runtime, not only inside Settings
- after downgrade, the toggles immediately render as off
- if the family later returns to `Plus`, live activities may be enabled again

Implementation status:

- backend access still exposes `can_use_live_activities`
- settings render effective toggle state from subscription access, not only from saved account preferences
- runtime sync stops live activities whenever the current family loses live-activity entitlement

### Pillbox / Doses

#### Free, normal case

- one pillbox reminder plan is fully usable
- the family may create, edit, and log doses only for that one plan

#### Downgrade from Plus with more than one plan

- one plan remains the `free_primary_pillbox_plan`
- primary selection prefers an `active` operational plan before any `paused` one
- if there are no active operational plans left, the oldest paused operational plan may remain primary
- every other active or paused plan is frozen in `paused` during downgrade sync
- frozen non-primary plans remain visible in the active list
- dose logs and plan history are preserved

#### Locked plan behavior after downgrade

For non-primary pillbox plans after downgrade:

- viewing the plan remains available
- viewing past dose history remains available
- editing the plan is locked
- deleting the frozen operational plan is locked
- logging a dose is locked
- switching the frozen plan from `paused` back to `active` is locked
- future reminders for that plan no longer continue because frozen non-primary plans stay paused

#### Why frozen plans stay paused instead of archived

- these are still operational plans, not historical records
- archiving them would move them into history and make their working state disappear
- freezing them as `paused` keeps them understandable in the UI
- after the family returns to `Plus`, those plans are still present and may be resumed again

Implementation status:

- enforced on backend during family subscription downgrade/snapshot sync
- one stable `free_primary_pillbox_plan_id` is persisted on the family
- non-primary operational plans are paused during downgrade
- pillbox mutations and dose logging are blocked on backend for non-primary plans in `Free`
- frontend routes `resume/edit/delete` attempts on frozen operational plans into the upgrade flow

## Subscription Ownership Rules

- the subscription is family-scoped
- the family has one stable `owner`
- the `owner` is the account that created the family
- only the `owner` may purchase, restore, renew, cancel, or otherwise manage the family subscription
- only the `owner` may create and share family invite links
- `admin` may manage family operations and member access, but may not manage billing
- `member` may use the unlocked features, but may not manage billing
- the first successful `Plus` purchase belongs to the `owner`
- every later billing action must come from the same `owner`

Deletion and exit rules:

- the active `owner` account must not be deletable while the family subscription is attached
- only the `owner` may delete the family
- the family itself may not be deleted while the subscription is still active or still in an access-grace state; deletion is allowed only after the family returns to `Free`
- if ownership transfer is needed in the future, it must be an explicit product flow; until then, prevent owner deletion instead of auto-moving subscription ownership
- `member` and `admin` may leave the family at any time unless the current account is also the billing owner
- leaving a family does not create a new account; it creates a new empty family for the same account
- after leaving, the account becomes the `owner` of that new empty family with default full access
- owner-danger UX should stay split:
  - active/grace subscription period -> `Cancel subscription`
  - returned to `Free` -> `Delete family`

## Family Roles

- `owner`
  - created the family
  - controls billing
  - may delete the family
  - may create/share family invites
  - may also manage every member and every access rule
  - may promote a `member` to `admin`
  - may demote an `admin` back to `member`
  - may delete both `member` and `admin`
- `admin`
  - may manage only `member` accounts
  - may change access rules for `member`
  - may update visible children/modules for `member`
  - may delete `member`
  - may not promote anyone to `admin`
  - may not demote another `admin`
  - may not manage `owner`
  - may not manage billing
  - may not create family invite links
  - may not delete the family
- `member`
  - may use features according to granted access
  - may not manage billing
  - may not manage the family
  - may not change their own family-level visibility or access rules

### Role Matrix

#### Owner

- manages subscription
- creates invites
- deletes family
- promotes `member -> admin`
- demotes `admin -> member`
- changes access policy for any participant
- removes `member`
- removes `admin`

#### Admin

- does not manage subscription
- does not create invites
- does not delete family
- does not manage `owner`
- does not manage other `admin`
- may manage only `member`
- may change access policy only for `member`
- may remove only `member`

#### Member

- does not manage anyone
- uses granted access only
- does not change family-level access for self
- may not elevate own rights

### Family Access Authority

- family-level visibility and rights are defined only by higher roles
- `owner` may define access for everyone
- `admin` may define access only for `member`
- `member` receives the configured access and does not reconfigure it for self

## Domain Model

- `user` = one person with one account
- `family` = shared family workspace
- `subscription` = billing state for a family
- `access` = effective rights of a specific account inside the family

Important rule:
- `free` is also a `family`, just with one member

## Existing Fields To Keep

Keep these fields on `families` as a denormalized snapshot:

- `owner_account_id`
- `billing_account_id`
- `plan_code`
- `subscription_status`
- `subscription_provider`
- `subscription_product_id`
- `subscription_expires_at`

They are useful for reads, but lifecycle logic should move into dedicated billing tables.

## New Database Tables

### `plans`

Purpose:
- tariff dictionary
- link plans to App Store products and RevenueCat entitlements

Suggested fields:
- `id`
- `code` unique: `free`, `plus`, `pro`
- `name`
- `is_active`
- `apple_product_id` nullable
- `revenuecat_entitlement_code` nullable
- `sort_order`
- `created_at`

### `subscriptions`

Purpose:
- store actual subscription lifecycle for a family

Suggested fields:
- `id`
- `family_id` FK -> `families.id`
- `plan_id` FK -> `plans.id`
- `provider` (`apple`, `revenuecat`, `admin`, `stub`)
- `provider_customer_id`
- `provider_subscription_id`
- `status` (`inactive`, `trialing`, `active`, `grace`, `canceled`, `expired`)
- `starts_at`
- `expires_at`
- `trial_ends_at`
- `canceled_at`
- `raw_payload_json`
- `created_at`
- `updated_at`

Notes:
- one family may have many historical subscriptions over time
- only one should be treated as current/active in business logic

### `billing_events`

Purpose:
- idempotent processing of provider updates
- debugging and audit trail for billing sync

Suggested fields:
- `id`
- `subscription_id` FK -> `subscriptions.id` nullable
- `family_id` FK -> `families.id`
- `provider`
- `event_type`
- `external_event_id` unique
- `payload_json`
- `processed_at`
- `created_at`

### `feature_overrides` optional

Purpose:
- support grants
- beta access
- promo unlocks
- temporary manual overrides

Suggested fields:
- `id`
- `family_id`
- `feature_code`
- `enabled`
- `expires_at`
- `reason`
- `created_at`

This table can be deferred if you want a smaller first release.

## Table Relationships

- `users` belong to `families`
- `families` have subscription state
- `plans` define commercial plan types
- `subscriptions.family_id` -> `families.id`
- `subscriptions.plan_id` -> `plans.id`
- `billing_events.subscription_id` -> `subscriptions.id`

## What Should Stay In Code

Do not move feature entitlements into DB yet.

Compute in backend code:
- `max_children`
- `max_adults`
- `max_pillbox_plans`
- `can_invite_members`
- `can_manage_roles`
- `can_export_csv`
- `can_use_live_activities`

Suggested rules:

`free`
- `max_children = 1`
- `max_adults = 1`
- `max_pillbox_plans = 1`
- `can_invite_members = false`
- `can_manage_roles = false`
- `can_export_csv = false`
- `can_use_live_activities = false`

`plus`
- unlimited children
- unlimited adults
- unlimited pillbox plans
- all premium capabilities enabled

## Backend Access Layer

Create a dedicated service, for example:

- `backend/src/application/services/subscription_access_service.py`

It should return effective access for a given account/family:

- `plan_code`
- `subscription_status`
- `premium_active`
- `has_plus_access`
- `can_invite_members`
- `can_manage_member_roles`
- `can_use_live_activities`
- `can_export_csv`
- `max_children`
- `max_adults`
- `max_pillbox_plans`
- `is_billing_owner`
- `can_manage_subscription`

Rules:
- backend computes access
- iOS and PWA only consume access flags

## Backend Use Cases To Protect

All real restrictions must be enforced on backend actions, not only in UI.

### Family Invites

- `free` cannot create invites
- only the `owner` can create/share invites

### Family Join / Accept Invite

- `free` cannot end up with a second family member

### Children

- `free` cannot create a second child

### Pillbox Plans

- `free` cannot create a second plan

### Live Activities

- feature must be unavailable in backend entitlement checks for `free`

### CSV Export

- export endpoint must be premium-only

### Roles And Access Settings

- `free` cannot use multi-member access management

## API Contract For Frontend

Expose one access-oriented payload.

Preferred shape:
- `GET /families/me/access`

Response should contain:
- `planCode`
- `subscriptionStatus`
- `premiumActive`
- `isBillingOwner`
- `canManageSubscription`
- `canInviteMembers`
- `canManageMemberRoles`
- `canUseLiveActivities`
- `canExportCsv`
- `maxChildren`
- `maxAdults`
- `maxPillboxPlans`
- `currentChildrenCount`
- `currentAdultsCount`
- `currentPillboxPlanCount`

Alternative:
- expand current `/families/me`

## Frontend Paylocked Model

Premium features should usually be shown as locked, not hidden.

Good candidates for locked UI:
- invite family member
- add second child
- create second pillbox plan
- `CSV export`
- `Live Activities`
- access roles/settings

Good candidates to fully hide:
- billing-owner controls from non-owner members
- advanced family settings when family has only one member

UI patterns:

### Locked Button

- button is visible
- badge like `Plus`
- click opens paywall

### Locked Section

- section is visible
- explanatory text says it is available in `Plus`
- CTA opens paywall

### Limit Hit Paywall

When user hits a free limit, show a contextual paywall:
- second child
- second pillbox plan
- second adult

Example message:
- `Free includes 1 child. Upgrade to Plus to add more children.`

## Paywall UX

Create one reusable paywall component.

Suggested entry points:
- `invite_family`
- `second_child`
- `second_plan`
- `live_activities`
- `csv_export`
- `roles_access`

Paywall content:
- what user tried to do
- why it is unavailable in `Free`
- what `Plus` unlocks
- purchase CTA
- restore purchases CTA
- dismiss action

## Local Development And Stub Billing

Before Apple and RevenueCat, add stub billing.

Dev-only endpoints:
- `POST /billing/debug/activate-plus`
- `POST /billing/debug/deactivate`
- `POST /billing/debug/expire`

Behavior:
- write/update `subscriptions`
- sync snapshot fields on `families`
- recompute access payload

Purpose:
- develop full access and paywall flows before real App Store integration

## Apple And RevenueCat Integration

Recommended production setup:
- Apple IAP on iOS
- RevenueCat as billing orchestration
- backend as access authority

Flow:
1. user logs into app
2. app calls `RevenueCat.logIn(appUserId)`
3. user purchases or restores
4. app or webhook syncs billing state to backend
5. backend updates `subscriptions`
6. backend refreshes family snapshot fields
7. client refetches access
8. locked features become active

## Ownership Model

The current product model intentionally avoids a separate dynamic `billing owner`.

- `owner` is the single stable billing authority
- `owner` also owns invite creation and family deletion
- `admin` manages operational family access only
- no ownership transfer flow exists yet

## Downgrade Behavior

This must be designed before launch.

When `Plus` expires:
- do not delete data
- keep history visible
- block creation of new premium-only entities
- keep over-limit data readable
- keep one explicit `free_primary_child_id` fully active for child-level actions
- lock child-level mutations for all other children
- keep already active illness episodes finishable even for non-primary children
- show a clear upgrade state

Example:
- family has 3 children and subscription expires
- all 3 remain visible
- one primary child keeps full child-level access in `Free`
- the other 2 children keep history, overview, analytics, growth, and illness visibility
- editing profile, starting observations, feeding, and sleep actions are paylocked for the non-primary children
- adding a 4th child is blocked
- paywall explains that `Plus` is required to continue expanding

## PWA And Website

Current recommendation:
- reuse the same backend access payload in PWA
- keep the same paylocked logic in web UI
- defer web checkout if needed

That lets you finish access and billing architecture once and reuse it everywhere.

## Landing And Pricing

This can be done last.

Recommended additions:
- `/pricing` page
- `Free vs Plus` comparison table
- FAQ:
  - how family billing works
  - who pays
  - how cancellation works
  - what happens after expiration

Suggested copy themes:
- one adult and one child are free
- family collaboration is included in `Plus`

## Current Testing Notes

- `Reset to free` only resets backend state and will be overwritten again by an active RevenueCat/Test Store subscription
- `Force free mode` is the intended local testing tool for downgrade logic
- `Resume RevenueCat sync` returns the current account to normal RevenueCat-driven behavior
- use `Force free mode` when you need to test:
  - `free_primary_child`
  - non-primary child locks
  - active illness continuation after downgrade
  - family access changes after subscription loss
- this tooling is intentionally dev-only and must not ship as user-facing release functionality
- `CSV export` and `Live Activities` are included in `Plus`

## Analytics

Track subscription funnel events:
- `paywall_opened`
- `paywall_entry_point`
- `purchase_started`
- `purchase_completed`
- `purchase_failed`
- `purchase_restored`
- `limit_hit_second_child`
- `limit_hit_second_plan`
- `limit_hit_invite_member`

## Tests

### Backend

- `free` cannot invite members
- `free` cannot add second child
- `free` cannot add second pillbox plan
- `plus` can do all these
- invited members receive shared family access
- owner-only billing rules work
- downgrade and expired states work correctly

### Frontend

- locked actions render correctly
- paywall opens from each entry point
- free hides or locks `Live Activities`
- UI unlocks after stub upgrade

### Billing

- stub activation works
- stub expiration works
- restore flow works
- repeated sync events are idempotent

## Recommended Rollout Order

### Phase 1

- freeze `Free` and `Plus` rules
- finalize downgrade behavior
- finalize owner/admin separation

### Phase 2

- add `plans`
- add `subscriptions`
- add `billing_events`
- seed base plans

### Phase 3

- implement `subscription_access_service`
- expose `/families/me/access`
- sync family snapshot fields from subscription state

### Phase 4

- enforce backend limits on invites, children, plans, exports, live activities

### Phase 5

- add frontend locked states
- add reusable paywall
- add contextual entry points

### Phase 6

- add stub billing endpoints
- test end-to-end upgrade and downgrade flows locally

### Phase 7

- add Apple products in App Store Connect
- configure RevenueCat entitlement
- add iOS purchase and restore flow
- sync billing to backend

### Phase 8

- add landing pricing page
- add FAQ and conversion copy

## Commonly Missed Details

- `Restore Purchases`
- `grace period`
- `billing issue` handling
- downgrade behavior
- transfer of billing owner
- preventing deletion of active billing owner
- idempotent billing event processing
- backend validation instead of only UI hiding
- development stubs before real App Store testing

## Family Switching Follow-up

- today one account can belong to only one family at a time
- joining another family with an existing account is allowed only if the current family is effectively empty:
  - no other active accounts
  - no children
  - no household medicines
  - no parent profiles
- this is acceptable for now for the flow:
  - one parent registered first
  - did not set up data yet
  - then got invited into the real family
- later we need an explicit product decision for non-empty families:
  - hard block with clear UX copy
  - guided leave-and-join flow
  - or real merge/transfer tooling
- this must remain an explicit product/data-safety decision, not a silent reassignment flow
