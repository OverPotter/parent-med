# Subscription Rollout Plan

## Implementation Checklist

- [x] Create a dedicated rollout plan in the repo
- [x] Add subscription access layer on backend
- [x] Expose access payload for frontend
- [x] Enforce backend free-plan limits on invites
- [x] Enforce backend free-plan limits on child count
- [x] Enforce backend free-plan limits on pillbox plans
- [ ] Add billing tables: `plans`, `subscriptions`, `billing_events`
- [ ] Add stub billing flow for local development
- [ ] Add frontend paylocked states and shared paywall
- [ ] Add Apple IAP and RevenueCat integration
- [ ] Add landing pricing page

## Completed Work

- [x] Rollout document created and committed in repo
- [x] Backend subscription access layer added via `SubscriptionAccessService`
- [x] Access payload exposed via `GET /families/me/access`
- [x] Free-plan backend limits added for invites, children, and pillbox plans
- [x] Covered by targeted backend tests:
  - `backend/tests/test_subscription_access_service.py`
  - `backend/tests/test_family_service.py`
  - `backend/tests/test_child_service.py`
  - `backend/tests/test_family_invite_service.py`
  - `backend/tests/test_family_access_services.py`

## Goal

Introduce `Free` and `Plus` plans without breaking the current family model.

Core principles:
- subscription is bought by one account
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
- family invites
- per-member access settings
- roles such as mother, father, grandmother, nanny
- plans for different family members
- collaborative use
- store who gave medicine and when
- `CSV export`
- `Live Activities`

## Domain Model

- `user` = one person with one account
- `family` = shared family workspace
- `subscription` = billing state for a family
- `access` = effective rights of a specific account inside the family

Important rule:
- `free` is also a `family`, just with one member

## Existing Fields To Keep

Keep these fields on `families` as a denormalized snapshot:

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
- only allowed admin/owner roles can invite

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

Distinguish two concepts:

### Billing Owner

- purchases the subscription
- manages subscription
- sees billing controls

### Family Admin

- invites members
- manages roles
- configures access policies

They may be the same account, but they should remain separate concepts in code.

## Downgrade Behavior

This must be designed before launch.

When `Plus` expires:
- do not delete data
- keep history visible
- block creation of new premium-only entities
- keep over-limit data readable
- optionally restrict some edits over free limits
- show a clear upgrade state

Example:
- family has 3 children and subscription expires
- all 3 remain visible
- adding a 4th child is blocked
- paywall explains that `Plus` is required to continue expanding

## PWA And Website

Initial recommendation:
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
