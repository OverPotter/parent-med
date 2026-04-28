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
- пересмотреть pre-auth UX invite flow:
  - сейчас пользователь по invite-ссылке сначала попадает на общий экран login/register
  - контекст семьи появляется только после входа или регистрации, из-за чего теряется смысл приглашения
  - нужен отдельный invite landing / accept screen до auth, чтобы сразу было понятно:
    - кто приглашает
    - в какую семью зовут
    - что произойдёт после входа или регистрации
- продумать короткий trial для `Plus`:
  - дать новому пользователю несколько дней полного доступа после первого входа / онбординга
  - после trial явно переводить в обычный `Plus` purchase flow или обратно в `Free`
  - заранее определить продуктовые правила:
    - trial только один раз на семью или на аккаунт
    - как trial сочетается с invite flow и owner-only billing
    - какие paywall и reminder события нужны перед окончанием trial
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
  - просмотр активных/trial/canceled подписок и их статусов
  - возможность выдавать доступ к подписке вручную через backend/БД вне App Store сценария
  - интерфейс для просмотра обращений и фиксации ответов/support history
  - аккуратная модель доступа, чтобы это не смешивалось с обычным клиентским приложением

### Invite / Family Switch Plan

Agreed product rules:
- `owner` не может принимать invite в другую семью
- две семьи не merge'ятся автоматически
- две подписки не объединяются
- если аккаунт уже состоит в семье и хочет перейти в другую, это допустимо только для `member/admin`
- переход `member/admin` в другую семью требует явного consent flow
- если у текущей семьи активная подписка или billing-контекст, переход запрещён до полного завершения подписочного периода
- бывший `owner` может быть приглашён в другую семью только после потери owner/billing-контекста и затем становится `member`

Implementation plan:
- зафиксировать эти правила как source of truth в invite/subscription docs
- закрыть backend-дыру в `accept invite`: запретить `owner`-switch и переход при активной подписке
- усилить проверку "текущая семья пустая" до полной проверки семейных данных, а не только части модулей
- убрать silent family deletion как побочный эффект invite-switch без отдельной безопасной валидации
- сделать consent-based family switch flow для `member/admin`
- переписать invite/join UI, чтобы он объяснял текущий family context и последствия перехода
- проверить anti-bypass billing cases: одна store subscription не должна активировать две семьи, `member/admin` не должен покупать `Plus`
- покрыть сценарии backend/frontend тестами

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
