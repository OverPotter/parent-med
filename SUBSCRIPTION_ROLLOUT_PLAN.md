# Subscription Source Of Truth

This is the current source-of-truth document for subscription, downgrade, billing ownership, and related family-access rules.

For high-level project docs, use:

- [docs/APP_ARCHITECTURE.md](./docs/APP_ARCHITECTURE.md)
- [docs/DATABASE_ARCHITECTURE.md](./docs/DATABASE_ARCHITECTURE.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)

## Current Status

Subscription baseline is already implemented.

Implemented now:
- backend access layer via `SubscriptionAccessService`
- frontend access payload via `GET /families/me/access`
- owner-only invites and owner-only billing
- `Free` limits for children, pillbox plans, `CSV export`, and `Live Activities`
- shared paywall / upgrade flow in family, child, pillbox, and settings screens
- downgrade-safe child model via `free_primary_child_id`
- downgrade-safe pillbox model via `free_primary_pillbox_plan_id`
- active illness continuation for non-primary child after downgrade
- RevenueCat dev/test integration scaffold and provider-sync backend flow
- local debug billing / force-free tooling for development
- targeted backend/frontend test coverage for subscription and downgrade flows

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

- `free` cannot create a second child

### Pillbox Plans

- `free` cannot create a second plan

### Live Activities

- feature must be unavailable in backend entitlement checks for `free`

### CSV Export

- export endpoint must be premium-only
- implemented as a child-scoped `Plus` feature from child profile
- supports `CSV`, `XLSX`, and `All files`
- locked state is visible in UI and routes into existing upgrade flow

### Roles And Access Settings

- `free` cannot use multi-member access management

## API Contract For Frontend

Frontend consumes one access-oriented payload.

- `GET /families/me/access`

Response contains:
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

One reusable paywall component is used across the app.

Current entry points:
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

## Ownership Model

The current product model intentionally avoids a separate dynamic `billing owner`.

- `owner` is the single stable billing authority
- `owner` also owns invite creation and family deletion
- `admin` manages operational family access only
- no ownership transfer flow exists yet

## Downgrade Behavior

Downgrade behavior is intentionally conservative.

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

## Invite / Family Switch Rules

Agreed rules:
- `owner` cannot accept an invite into another family
- two existing families must not merge automatically
- two subscriptions must not merge automatically
- only `member/admin` accounts may switch to another family, and only through an explicit consent flow
- if the current family still has active subscription access or billing ownership context, family switch is blocked
- a former `owner` may join another family only after the original family has fully returned to non-premium state and the owner/billing context is gone
- after such a switch, the invited account becomes `member`

Reasoning:
- this keeps billing ownership simple and stable
- this avoids accidental deletion or orphaning of subscription state
- this prevents subtle bypass flows where one paid subscription could appear to move between families
