# Environment Map

Этот файл нужен как короткая карта проекта: что у нас называется как, какие домены считать каноническими, где лежат важные env и как запускать `dev` и `prod` без путаницы.

## Как проект сейчас называется

У нас одновременно есть несколько имён, и это нормально:

- репозиторий: `parent-med`
- продовый backend Railway service/domain: `parent-med-production`
- продовый frontend Railway service/domain: `parent-med-production-frontend`
- мобильное приложение и часть branding: `PillPath`
- iOS bundle id: `com.overpotter.pillpath`

Главное правило:
- `parent-med` — это инфраструктура и репозиторий
- `PillPath` — это пользовательское имя приложения и часть mobile-конфига

Из-за этого легко перепутать старые и новые URL, поэтому ниже зафиксированы текущие канонические адреса.

## Канонические URL

### Production

Backend:
- origin: `https://parent-med-production.up.railway.app`
- Swagger: `https://parent-med-production.up.railway.app/docs`
- API base: `https://parent-med-production.up.railway.app/api/v1`

Frontend:
- web app: `https://parent-med-production-frontend.up.railway.app`

Важно:
- для мобильной `prod` сборки backend должен быть именно `parent-med-production.up.railway.app`
- старый/ошибочный домен `pillpath-production.up.railway.app` использовать не надо

### Local development

Backend:
- `http://localhost:8000`

Frontend:
- `http://localhost:5173`

Vite dev proxy:
- `/api` проксируется в `http://localhost:8000`

Следствие:
- для обычного web-dev `VITE_API_URL` локально не нужен
- фронт работает через Vite proxy

## Где какие настройки лежат

### Backend env

Основная точка:
- [backend/.env.example](/Users/artem/project/parent-med/backend/.env.example:1)

В проде реальные значения лежат:
- в Railway Variables backend-сервиса

Ключевые переменные backend:
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `RUN_CURATED_CATALOG_SEED`
- `APNS_*`
- `WEB_PUSH_*`

### Frontend env

Шаблон:
- [frontend/.env.example](/Users/artem/project/parent-med/frontend/.env.example:1)

Ключевые переменные frontend:
- `VITE_API_URL`
- `VITE_APP_SITE_URL`
- `VITE_PRIVACY_POLICY_URL`
- `VITE_TERMS_OF_USE_URL`
- `VITE_SUPPORT_URL`
- `VITE_MARKETING_SITE_URL`
- `VITE_HITKEEP_SCRIPT_URL`

Важно:
- `VITE_*` вшиваются в сборку на этапе build
- если поменяли `VITE_API_URL`, нужно пересобрать фронт

### iOS / Capacitor

Основной конфиг:
- [frontend/capacitor.config.ts](/Users/artem/project/parent-med/frontend/capacitor.config.ts:1)

Там зафиксированы:
- app name: `PillPath`
- app id: `com.overpotter.pillpath`
- `webDir = "www"`

Это не место для backend URL. Backend URL приходит из frontend env через `VITE_API_URL` на этапе сборки web-части.

## Как запускать проект

## Web dev

Backend:

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Что происходит:
- backend живёт на `:8000`
- frontend живёт на `:5173`
- `VITE_API_URL` для web-dev обычно не нужен
- API идёт через Vite proxy

## Web production build

```bash
cd frontend
npm run build
```

Если это реальный production build фронта, до сборки должен быть задан корректный:

```env
VITE_API_URL=https://parent-med-production.up.railway.app
```

## Mobile iOS dev build

Команда:

```bash
cd frontend
npm run build:mobile:dev
```

Это режим для локального backend.

Важно:
- для mobile-dev нельзя использовать `localhost`
- нужно указывать IP машины в локальной сети в `.env.mobile-dev.local` или другом соответствующем Vite env override

Иначе телефон не достучится до локального API.

## Mobile iOS production build

Команда:

```bash
cd frontend
npm run build:mobile:prod
```

Потом:

```bash
npx cap open ios
```

Или:

```bash
npm run cap:open:ios
```

Правило для `prod`:
- перед сборкой убедиться, что `VITE_API_URL` указывает на реальный prod backend:

```env
VITE_API_URL=https://parent-med-production.up.railway.app
```

Если там окажется старый или неправильный домен, приложение запустится, но auth и API будут падать `Network Error`.

## Где смотреть Railway

Нас обычно интересуют 3 сущности:

1. Backend service
- код backend
- миграции
- Swagger
- API

2. Frontend service
- web frontend
- статическая сборка Vite

3. Postgres service
- продовая БД

Что где проверять:
- backend domain: в Railway backend service
- frontend domain: в Railway frontend service
- DB public URL: в Railway Postgres Variables

## Где брать креды

### Backend / frontend env

Источник правды:
- Railway Variables

Не надо хранить реальные продовые секреты в git.

### База данных

Для локального подключения извне нужен:
- `DATABASE_PUBLIC_URL`

Не подойдёт:
- `postgres.railway.internal`

Потому что это внутренний Railway host, доступный только из их приватной сети.

Для DataGrip / psql нужен именно публичный proxy URL.

## Что важно помнить про каталог лекарств

Схема:
- миграции идут автоматически

Данные каталога:
- не через миграции
- а через seed-скрипт

Это контролируется флагом:

```env
RUN_CURATED_CATALOG_SEED=1
```

Подробности:
- [medicine-catalog-seeding.md](/Users/artem/project/parent-med/docs/medicine-catalog-seeding.md:1)

## Частые ошибки

### 1. Перепутали backend domain

Симптом:
- mobile/web открывается
- auth падает `Network Error`

Типичная причина:
- в `VITE_API_URL` подставлен не тот Railway host

### 2. Перепутали `parent-med` и `PillPath`

Нормальная схема:
- домены и сервисы у нас сейчас `parent-med-*`
- branding и mobile bundle местами всё ещё `PillPath`

Это не баг само по себе.

### 3. Поменяли env без пересборки фронта

Симптом:
- в коде env уже исправлен
- приложение всё ещё ходит в старый URL

Причина:
- `VITE_*` уже были зашиты в старый bundle

Решение:
- пересобрать frontend/mobile build

### 4. Использовали private DB host с локальной машины

Симптом:
- подключение к Postgres не работает

Причина:
- использован `railway.internal`

Решение:
- брать `DATABASE_PUBLIC_URL`

## Что полезно проверять первым делом

Если не работает API:
1. Какой сейчас `VITE_API_URL`
2. Открывается ли `https://<backend>/docs`
3. Открывается ли `https://<backend>/health`, если health route есть
4. На какой домен реально уходят запросы из Network/Xcode logs

Если не работает БД:
1. Используется ли public DB URL
2. Совпадает ли Railway Postgres instance с тем, что ты смотришь

Если не работает мобильная `prod` сборка:
1. Проверить `VITE_API_URL`
2. Пересобрать `build:mobile:prod`
3. `npx cap sync ios`
4. переустановить app на устройство
