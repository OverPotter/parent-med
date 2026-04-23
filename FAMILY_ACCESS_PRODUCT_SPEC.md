# Family Access Product Spec

## Goal

Family access should answer three simple user questions:

1. What can this person see?
2. What can this person do?
3. In which specific case does this person participate?

The model should feel natural for a family:

- one person manages a process
- another person only watches
- a third person only performs a narrow action

This document defines the product meaning of access roles in plain language.

## Core Model

There are three layers.

### 1. Family access

This is the upper limit of what a family member is allowed to do at all.

Configured by family admin.

Controls:

- which children are visible
- whether child data is view-only or editable
- whether cabinet is hidden, visible, or editable
- whether pillbox is hidden, visible, action-only, or editable
- whether cabinet reminders are allowed for this member

Family access does not decide every notification in every case.
It only defines eligibility.

### 2. Case participation

This defines who participates in a specific illness or pillbox plan.

Configured by the editor of that case.

Examples:

- illness episode participants
- pillbox plan participants
- cabinet recipients at family level

Case participation only works inside the limits of family access.

### 3. Personal delivery preferences

This defines how the person wants to receive allowed signals.

Configured by the person on their own account or device.

Examples:

- push on or off
- reminder lead time
- live activity on or off

Personal preferences can reduce delivery for that person, but can never expand access.

## Main Rule

Delivery works as an intersection:

`family access + case participation + personal preference + device permission`

If one of these is missing, the person does not receive the signal.

## Family Roles

### Admin

Admin manages the family structure and access rules.

Admin can:

- invite and remove members
- change family roles
- configure access for each member
- configure family-level cabinet recipients

Admin is still bound by their own access policy for day-to-day data visibility.

### Member

Member does not manage family structure.

Member only works inside the access given by admin.

## Children Scope

Children visibility defines which children a person can work with.

Options:

- all children
- selected children

If a child is not included, that member must not:

- see the child profile
- see illness history for that child
- receive illness signals for that child
- interact with child-bound data for that child

## Children Access

### View

The member can observe child-related information but cannot change it.

This includes:

- child profile
- illness history
- sleep history
- feeding history
- measurements

This role is for observers.

Typical example:

- father monitors
- grandparent reads updates

### Edit

The member can create and edit child-related records.

This includes:

- starting and editing illness episodes
- adding notes and measurements
- working with child-bound history

This role is for the person who leads the process.

Typical example:

- mother manages the child record

## Illness

Illness uses child access as its base permission.

### Who can see illness

Any member who has access to that child.

### Who can edit illness

Only a member with `children access = edit`.

This includes:

- create episode
- edit episode
- add comments
- add measurements
- manage reminders inside the episode
- change illness participants

### Who can participate in an illness case

Any member who has access to that child.

This means the system supports a real-life observer pattern:

- one parent leads the case
- another parent watches and receives reminders

### Product meaning

Illness has two practical user roles:

- observer: sees and follows the case
- editor: manages the case

## Pillbox

Pillbox is the most granular module because it supports three user behaviors.

### View

The member can observe pillbox plans.

They can:

- see the plan
- see schedule and status
- monitor reminders

They cannot:

- mark a dose as taken
- edit the plan

This role is for a monitor.

Typical example:

- second parent watches whether medicine was given

### Act

The member can perform the narrow action of confirming a dose.

They can:

- see the plan
- mark a dose as taken

They cannot:

- create a plan
- edit a plan
- change participants

This role is for an executor.

Typical example:

- nanny gives the medicine and confirms it

### Edit

The member can manage pillbox plans fully.

They can:

- create and edit plans
- manage medicines inside a plan
- manage plan participants

This role is for the person who configures the workflow.

Typical example:

- parent creates the treatment plan for others

### Important dependency

`pillbox = edit` requires `children access = edit`

This prevents a contradictory setup where someone can fully manage treatment plans while being only a viewer for child data.

### Who can participate in a pillbox plan

Any member with `pillbox access != none`.

That means:

- observer can be included
- executor can be included
- editor can be included
- hidden member cannot be included

This is intentional.

The product meaning is:

- observer monitors
- executor performs
- editor configures

## Cabinet

Cabinet is a family-level module, not a case-level child workflow.

### View

The member can see the home medicine cabinet and expiry information.

### Edit

The member can edit cabinet contents.

### None

The member cannot see cabinet data at all.

### Cabinet reminders

Cabinet reminders are family-level.

They can only go to members who:

- have cabinet access
- are selected as cabinet recipients, or fall under the “all eligible members” mode
- have personal push enabled

If cabinet access is hidden, cabinet reminders must be off for that member.

## Notification Meaning

The product should avoid treating notifications as a separate permission system.

Notifications follow the product meaning of participation.

### Illness

Illness notifications mean:

- this person participates in this illness case

### Pillbox

Pillbox notifications mean:

- this person participates in this plan

The action they can take depends on their pillbox role:

- observer sees the reminder
- executor can confirm the dose
- editor can reconfigure the plan

### Cabinet

Cabinet notifications mean:

- this person is responsible for watching cabinet status

## UX Language

The product should prefer human role language over system language.

Recommended wording:

- child view: "Observes child data"
- child edit: "Manages child data"
- pillbox view: "Monitors plan"
- pillbox act: "Can confirm dose"
- pillbox edit: "Manages plan"
- illness participants: "Who follows this case"
- pillbox participants: "Who participates in this plan"
- cabinet recipients: "Who receives cabinet reminders"

Avoid exposing raw internal concepts when possible:

- avoid overusing "recipient"
- avoid explaining access in backend-style terms
- avoid mixing family eligibility and case participation in one sentence

## Recommended Mental Model

For users, the app should consistently communicate this:

- admin decides what a person is allowed to access
- case editor decides who is involved in this specific case
- each person decides how they personally want to receive allowed signals

This is the target user-facing logic of the system.

## Practical Examples

### Example 1. Mother leads, father monitors

- father has child access = view
- father sees the child and illness
- mother creates illness episode
- mother includes father in illness participants
- father receives illness reminders and follows the case
- father cannot edit the episode

### Example 2. Parent creates plan, nanny executes

- nanny has pillbox access = act
- parent has pillbox access = edit
- parent creates plan and includes nanny
- nanny receives reminders and confirms doses
- nanny cannot edit the plan

### Example 3. Grandparent watches cabinet only

- grandparent has cabinet access = view
- grandparent has no child access
- grandparent is selected for cabinet reminders
- grandparent receives expiry reminders
- grandparent does not see illness or child data

### Example 4. Observer in pillbox

- father has pillbox access = view
- mother includes father in plan participants
- father sees reminders and plan state
- father cannot confirm a dose
- father acts as a monitor only

## Product Risks To Avoid

- letting hidden members remain selectable in case participants
- letting users receive signals for objects they cannot access
- using different meanings for the same role label across modules
- exposing too many technical toggles in family access
- making notifications feel like a separate permission tree

## Current Product Position

The current model should stay aligned to this principle:

- illness = observer or editor
- pillbox = observer, executor, or editor
- cabinet = viewer or editor, with family-level reminder selection

This is a valid family collaboration model and should not be simplified by removing real-world roles that families actually need.
