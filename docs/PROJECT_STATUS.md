# Project Status

Это рабочий high-level статус проекта.

Документ отвечает на три вопроса:

1. Что уже считается реализованным.
2. Что сейчас является source of truth.
3. Что осталось добить.

## Current Source Of Truth

### Product / Architecture

- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [PROJECT_MAP.md](./PROJECT_MAP.md)

### Subscription / Downgrade / Billing

- [SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)

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

## Current Open Work

### Release cleanup

- убрать dev-only RevenueCat sandbox controls перед релизом
- проверить production CTA для `Manage subscription`
- пройти final release smoke-test на iOS device
- перед релизом пройти checklist из [DEVELOPMENT_GUARDRAILS.md](./DEVELOPMENT_GUARDRAILS.md)

### Documentation cleanup

- держать `APP_ARCHITECTURE.md` и `DATABASE_ARCHITECTURE.md` как main docs
- использовать `SUBSCRIPTION_ROLLOUT_PLAN.md` только для detailed rollout logic
- старые worklog/spec файлы уже удалены из root как дублирующие

### Product follow-ups

- отдельно продумать семейный switch / merge flow:
  - что делать, если уже существующий аккаунт с непустой семьёй хотят пригласить в другую семью
- отдельно продумать legal/data-retention story для family deletion
- проверить автоопределение языка по устройству и первый launch-language flow
- проверить автоопределение темы по устройству и initial theme sync
- оценить добавление `Polish` и `German` локализаций:
  - где хватит текущей i18n-архитектуры
  - какие продуктовые экраны и paywall-copy будут самыми дорогими по переводу
- продумать internal admin/support console:
  - можно ли локально или по отдельному internal URL поднимать админку
  - ручное выставление `Free / Plus` в обход store-платежей для support и тестов
  - просмотр аккаунтов и семей
  - базовый обзор количества аккаунтов / семей
  - просмотр входящих сообщений / обращений от пользователей
  - аккуратная модель доступа, чтобы это не смешивалось с обычным клиентским приложением

## Legacy Cleanup

Старые family/worklog markdown-файлы удалены из root.

Их содержимое перенесено в:

- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [../SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
