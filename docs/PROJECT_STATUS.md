# Project Status

Это рабочий high-level статус проекта.

Документ отвечает на два вопроса:

1. Что уже считается реализованным.
2. Что сейчас является source of truth.

## Current Source Of Truth

### Product / Architecture

- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [PROJECT_MAP.md](./PROJECT_MAP.md)

### Subscription / Downgrade / Billing

- [SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
  - current baseline is implemented
  - this doc should be read as source of truth for current rules and behavior

### Release / App Store

- [APP_MIGRATION_TODO.md](./APP_MIGRATION_TODO.md)
- [APP_STORE_REVIEW_NOTES.md](./APP_STORE_REVIEW_NOTES.md)

## What Is Already In Place

### Family and roles

- `owner / admin / member` модель проведена в backend и frontend
- только `owner` управляет подпиской и приглашениями
- `admin` управляет только `member`
- `member` никем не управляет
- `admin/member` могут выйти из семьи
- выход из семьи не создаёт новый аккаунт, а переводит тот же аккаунт в новую пустую семью

### Family access

- есть granular `access_policy`
- есть `children scope`
- есть отдельные доступы к:
  - детям
  - аптечке
  - приёмам
- family UI приведён к owner/admin/member модели

### Children / illness

- `Free` поддерживает одного активного ребёнка
- после downgrade:
  - один `free_primary_child` остаётся полностью активным
  - остальные дети остаются видимыми, но locked на mutation-часть
- активную болезнь у non-primary child можно довести до конца
- active sleep/feeding у non-primary child force-stop при downgrade

### Pillbox

- `Free` поддерживает один operational plan
- после downgrade:
  - один plan остаётся primary
  - остальные operational plans остаются видимыми и frozen в `paused`
  - completed/archive history сохраняется отдельно
  - log/edit/delete/resume для non-primary frozen plans locked

### Billing / subscription

- subscription — family-scoped
- owner-only billing model
- RevenueCat dev/test integration scaffold уже есть
- есть dev-only force-free tooling для ручного тестирования

### Offline / network behavior

- основные модули приведены к единому offline-screen:
  - `Семья`
  - `Дети`
  - `Аптечка`
  - `Приёмы`
- если сети нет, модуль показывает единый `Нет сети` экран

### CSV / XLSX Export

Implemented product shape:
- export stays a `Plus` feature
- export is child-scoped, not settings-scoped
- entry point lives in child profile
- the profile button opens a mobile-first bottom sheet
- no separate profile CSV exists
- export is split into:
  - `analytics_summary`
  - `child_care`
  - `child_illness`

Current user flow:
- open a child profile
- tap `Поделиться CSV`
- choose one export type or `Все файлы`
- choose a fixed period: `2 недели`, `30 дней`, `6 месяцев`, `Всё время`
- save `CSV` or `XLSX`
- on iOS the file is delivered through native share flow

Current file behavior:
- `analytics_summary` is the only top-level summary file
- `child_care` is a detailed care journal with separate tables for sleep, feeding, weight, and height
- `child_illness` is a readable illness journal with child/period context, episode timeline, human-readable event labels, and localized temperature methods
- `Все файлы` supports:
  - ZIP with three CSV files
  - XLSX workbook with three sheets

Access / paylock behavior:
- profile button stays visible
- non-Plus users see `Plus` badge on the button
- clicking locked export opens the existing upgrade dialog
- backend still enforces premium-only export access

Implementation notes:
- iOS-first delivery uses native share flow instead of browser-style downloads
- backend payload loading is selective per export type to avoid unnecessary child-history reads
- readable examples live in `frontend/docs/csv-examples/`

## Legacy Cleanup

Старые family/worklog markdown-файлы удалены из root.

Их содержимое перенесено в:

- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [../SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
