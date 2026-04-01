# Pillbox API Design

## Goal

`PillboxPage` on the frontend currently edits a full family medication plan as a single draft:

- plan title
- selected family members
- medications inside the plan
- medication times
- meal rule
- repeat days
- course mode and dates

The API should match that editing model instead of forcing the frontend into many small mutations.

## Domain split

`episode_medication_plans` must stay inside illness flows.

`pillbox` is a separate family-level module:

- not tied to an illness episode
- can contain multiple medications
- can notify multiple family members
- can exist without a child context

## Proposed resources

### 1. Pillbox plan

Family-level plan container.

Fields:

- `id`
- `family_id`
- `title`
- `status` — `active | paused | archived`
- `member_account_ids`
- `created_by_account_id`
- `created_at`
- `updated_at`

### 2. Pillbox medication

Medication row inside a plan.

Fields:

- `id`
- `plan_id`
- `household_medicine_id | null`
- `custom_medicine_name | null`
- `dose_amount`
- `times`
- `meal_rule` — `before_meal | with_meal | after_meal`
- `repeat_days` — array of ISO weekday numbers `1..7`
- `course_mode` — `continuous | period`
- `course_start_date | null`
- `course_end_date | null`
- `position`
- `created_at`
- `updated_at`

### 3. Pillbox dose log

Recorded fact that a planned dose was taken.

Fields:

- `id`
- `plan_id`
- `medication_id`
- `taken_at`
- `taken_by_account_id | null`
- `taken_by_name_snapshot | null`
- `amount_snapshot`
- `source` — `manual | reminder`
- `notes | null`

## API shape

The frontend editor currently saves the whole plan draft. Because of that, the main write path should support nested payloads.

### GET `/pillbox-plans`

Returns hub cards for the main pillbox screen.

Response item:

- `id`
- `title`
- `status`
- `member_account_ids`
- `member_labels`
- `active_medication_count`
- `next_dose_at | null`
- `next_dose_label | null`
- `course_progress_ratio | null`
- `course_day_label | null`
- `medications_preview`

### GET `/pillbox-plans/{plan_id}`

Returns full editable plan detail.

Response:

- `id`
- `title`
- `status`
- `member_account_ids`
- `medications: PillboxMedicationResponse[]`
- `summary`

### POST `/pillbox-plans`

Creates a full plan in one request.

Body:

- `title`
- `member_account_ids`
- `medications: PillboxMedicationWriteDto[]`

### PATCH `/pillbox-plans/{plan_id}`

Updates the full plan in one request.

Body:

- `title`
- `member_account_ids`
- `status?`
- `medications: PillboxMedicationWriteDto[]`

Update semantics:

- medications with existing `id` are updated
- medications without `id` are created
- medications missing from payload are deleted

This matches the current frontend draft flow and keeps the editor simple.

### DELETE `/pillbox-plans/{plan_id}`

Deletes the whole plan.

### POST `/pillbox-plans/{plan_id}/medications/{medication_id}/take`

Creates a dose log and returns refreshed plan summary.

Body:

- `taken_at?`
- `source`
- `notes?`

## Validation rules

- plan must have non-empty `title`
- plan may have zero medications while user is still drafting, but persisted plan should require at least one medication
- medication must have either `household_medicine_id` or `custom_medicine_name`
- medication must have at least one valid time
- `repeat_days` cannot be empty
- `course_end_date >= course_start_date`
- `period` mode requires both dates
- `continuous` mode must clear both dates
- all selected members must belong to current family

## Why whole-plan writes first

Current `PillboxPage` already works as a nested editor in memory.

If backend starts with fine-grained medication endpoints only, frontend will need:

- optimistic ordering logic
- temporary IDs
- more edge-case recovery
- partial-save reconciliation

That is unnecessary for the current product stage.

The simplest stable path is:

1. whole-plan CRUD
2. dose logging
3. only later, if needed, split into granular nested endpoints
