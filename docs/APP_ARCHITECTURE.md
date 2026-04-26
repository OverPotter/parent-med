# App Architecture

Это главный обзорный документ по приложению.

Если нужно быстро понять, что такое `PillPath`, из каких модулей он состоит и как сейчас устроен продукт, начинать лучше отсюда.

## Что такое PillPath

`PillPath` — семейное приложение для:

- ведения детей
- журнала болезни
- домашней аптечки
- планов приёма лекарств
- совместной работы семьи в одном пространстве

Продуктовая модель строится вокруг `family`.

У каждого аккаунта есть семейный контекст:

- дети принадлежат семье
- аптечка принадлежит семье
- pillbox-планы принадлежат семье
- подписка принадлежит семье

## Ключевые домены

### 1. Family

Семья — главный контейнер данных.

Она хранит:

- участников
- роли
- доступы
- подписочный статус
- owner/billing-контекст

Главная ролевая модель сейчас:

- `owner` — управляет всей семьёй, подпиской и приглашениями
- `admin` — управляет только `member`
- `member` — никем не управляет, только пользуется выданным доступом

### 2. Children

Модуль детей — это:

- профили детей
- базовые данные
- overview / calendar
- вес
- рост
- baby-mode (`sleep`, `feeding`)

Этот модуль является основой для журнала болезни.

### 3. Illness Journal

Журнал болезни строится поверх ребёнка.

Он включает:

- illness episodes
- temperatures
- administrations
- illness comments
- episode medication plans

Это care-flow с отдельной downgrade-логикой:

- активную болезнь можно довести до конца даже после окончания `Plus`
- но новый illness для locked-child запускать нельзя

### 4. Medicine Cabinet

Аптечка семьи хранит реальные домашние лекарства.

Это не просто каталог, а семейный runtime-слой:

- реальные упаковки
- сроки годности
- opened-at / opened shelf life
- комментарии
- snapshot справочной информации

Аптечка нужна и сама по себе, и как источник данных для illness/pillbox flows.

### 5. Pillbox

`Pillbox` — семейные планы приёма лекарств.

Он включает:

- pillbox plans
- medicines inside a plan
- dose logs
- reminder recipients
- analytics/history

В правах есть три уровня:

- `view`
- `act`
- `edit`

При downgrade из `Plus` во `Free` один plan остаётся operational, остальные operational plans остаются видимыми, переводятся в frozen `paused` и становятся locked.

Исторические `completed / archived` планы при этом остаются обычной историей.

### 6. Subscription / Billing

Подписка семейная.

Основные правила:

- подписка принадлежит семье
- управляет подпиской только `owner`
- доступы даются всей семье
- backend — source of truth
- RevenueCat / App Store дают billing-state, но не принимают access-решения сами

## Главные продуктовые правила

### Access model

Доступ всегда задаётся сверху вниз:

- `owner` управляет всеми
- `admin` управляет только `member`
- `member` не меняет чужие права

Участнику можно отдельно выдать:

- children access
- cabinet access
- pillbox access
- children scope (`all children` / `selected children`)

### Subscription model

Планы:

- `Free`
- `Plus`

`Free` ограничивает:

- количество детей
- количество pillbox-планов
- family invites
- `Live Activities`

### Downgrade model

После окончания `Plus`:

- один ребёнок остаётся полностью активным
- остальные дети остаются видимыми, но частично locked
- одна pillbox-сущность остаётся operational
- активная болезнь может быть завершена
- active sleep/feeding force-stop
- live activities выключаются

Подробная матрица — в [SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md).

## Техническая карта

### Backend

- `backend/src/application/services/*` — бизнес-логика
- `backend/src/api/routers/*` — HTTP API
- `backend/src/infrastructure/database/models/*` — SQLAlchemy models
- `backend/src/infrastructure/database/repositories/*` — DB repositories
- `backend/alembic/versions/*` — schema migrations

### Frontend

- `frontend/src/client/pages/*` — основные продуктовые экраны
- `frontend/src/shared/api/*` — API-клиенты
- `frontend/src/shared/permissions/*` — доступы и capability-checks
- `frontend/src/shared/types/*` — DTO/transforms
- `frontend/src/app/*` — app/runtime integrations

## Где что читать дальше

Если нужна:

- общая навигация по проекту — [README.md](../README.md)
- схема данных — [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- текущее состояние и backlog — [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- детальная матрица подписки и downgrade — [SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
