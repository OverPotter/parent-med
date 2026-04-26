# Project Map

Это главный operational-файл по проекту. Если новый агент заходит в репозиторий и ему нужно быстро понять, как всё устроено и как это запускать, начинать надо отсюда.

## Что как называется

У нас одновременно есть несколько имён:

- репозиторий: `parent-med`
- продовый backend Railway service/domain: `parent-med-production`
- продовый frontend Railway service/domain: `parent-med-production-frontend`
- пользовательское название приложения: `PillPath`
- iOS bundle id: `com.overpotter.pillpath`

Главное правило:
- `parent-med` — это инфраструктура и репозиторий
- `PillPath` — это branding приложения и mobile-слой

## Канонические URL

### Production

Backend:
- origin: `https://parent-med-production.up.railway.app`
- Swagger: `https://parent-med-production.up.railway.app/docs`
- API base: `https://parent-med-production.up.railway.app/api/v1`

Frontend:
- web app: `https://parent-med-production-frontend.up.railway.app`

Важно:
- для mobile `prod` backend должен быть именно `parent-med-production.up.railway.app`
- старые `pillpath-production.*` нельзя считать актуальными по умолчанию

### Local development

Backend:
- `http://localhost:8000`

Frontend:
- `http://localhost:5173`

Vite proxy:
- `/api` -> `http://localhost:8000`

## Где лежат настройки

### Backend env

Основная точка:
- [backend/.env.example](/Users/artem/project/parent-med/backend/.env.example:1)

В проде реальные значения живут:
- в Railway Variables backend-сервиса

Ключевые переменные:
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `RUN_CURATED_CATALOG_SEED`
- `APNS_*`
- `WEB_PUSH_*`

### Frontend env

Шаблон:
- [frontend/.env.example](/Users/artem/project/parent-med/frontend/.env.example:1)

Ключевые переменные:
- `VITE_API_URL`
- `VITE_APP_SITE_URL`
- `VITE_PRIVACY_POLICY_URL`
- `VITE_TERMS_OF_USE_URL`
- `VITE_SUPPORT_URL`
- `VITE_MARKETING_SITE_URL`
- `VITE_HITKEEP_SCRIPT_URL`

Важно:
- `VITE_*` вшиваются в build
- после изменения `VITE_API_URL` фронт нужно пересобирать

### iOS / Capacitor

Основной конфиг:
- [frontend/capacitor.config.ts](/Users/artem/project/parent-med/frontend/capacitor.config.ts:1)

Там зафиксированы:
- app name: `PillPath`
- app id: `com.overpotter.pillpath`
- `webDir = "www"`

Backend URL там не задаётся. Он приходит из frontend env на этапе сборки web-части.

## Как запускать проект

### Web dev

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
- backend на `:8000`
- frontend на `:5173`
- `VITE_API_URL` для web-dev обычно не нужен
- API идёт через Vite proxy

### Web production build

```bash
cd frontend
npm run build
```

Для реальной production-сборки до build должен быть задан:

```env
VITE_API_URL=https://parent-med-production.up.railway.app
```

### Mobile iOS dev build

```bash
cd frontend
npm run build:mobile:dev
```

Важно:
- для mobile-dev нельзя использовать `localhost`
- нужен IP машины в локальной сети

### Mobile iOS production build

```bash
cd frontend
npm run build:mobile:prod
npx cap open ios
```

Перед сборкой проверить:

```env
VITE_API_URL=https://parent-med-production.up.railway.app
```

Если там неправильный домен, мобильное приложение поднимется, но auth/API начнут падать `Network Error`.

## Railway: что где находится

Нас обычно интересуют 3 сущности:

1. Backend service
- код backend
- миграции
- Swagger
- API

2. Frontend service
- web frontend
- Vite build

3. Postgres service
- продовая БД

Что проверять:
- backend domain: в Railway backend service
- frontend domain: в Railway frontend service
- DB public URL: в Railway Postgres Variables

## Где брать креды

### Backend / frontend env

Источник правды:
- Railway Variables

Не хранить реальные секреты в git.

### База данных

Для локального подключения извне нужен:
- `DATABASE_PUBLIC_URL`

Не подходит:
- `postgres.railway.internal`

Потому что это внутренний Railway host, доступный только внутри их сети.

Для DataGrip / psql нужен именно public proxy URL.

## Как каталог лекарств попадает на сервер

Главное правило:
- схема БД меняется через Alembic
- записи каталога не живут в миграциях
- каталог наполняется seed-скриптом

Источник данных:
- `backend/data/curated_medicine_catalog_seed.json`
- `backend/data/curated_medicine_catalog_seed_part2.json`
- `backend/data/curated_medicine_catalog_seed_part3.py`
- `backend/data/curated_medicine_catalog_seed_part4.py`
- `backend/data/curated_medicine_catalog_seed_part5.py`

Скрипт:
- `backend/scripts/seed_curated_medicine_catalog.py`

### Локальный запуск сидера

```bash
cd backend
uv run python scripts/seed_curated_medicine_catalog.py
```

Минимальная проверка:

```sql
select language, count(*)
from curated_medicine_catalog_items
group by language
order by language;
```

### Автосид на сервере

Флаг:

```env
RUN_CURATED_CATALOG_SEED=1
```

Если он включён, backend после миграций выполнит:

```bash
uv run python scripts/seed_curated_medicine_catalog.py
```

Поддержка этого уже встроена в:
- [backend/railway.toml](/Users/artem/project/parent-med/backend/railway.toml:1)
- [backend/docker/entrypoint.sh](/Users/artem/project/parent-med/backend/docker/entrypoint.sh:1)
- [backend/.env.example](/Users/artem/project/parent-med/backend/.env.example:1)

Важно:
- `backend/data/*` должно попадать в Docker image
- иначе seed упадёт с `Curated medicine catalog seed is empty`

### Как обновлять каталог правильно

1. Обновить seed-файлы в `backend/data/`
2. Локально прогнать сидер
3. Проверить выборками БД
4. Закоммитить seed-изменения
5. Задеплоить backend
6. Прогнать seed на сервере или включить `RUN_CURATED_CATALOG_SEED=1`

Чего не делать:
- не массово вставлять каталог руками через DataGrip
- не переносить catalog data в Alembic data-migrations

## Частые ошибки

### 1. Перепутали backend domain

Симптом:
- mobile/web открывается
- auth падает `Network Error`

Причина:
- в `VITE_API_URL` подставлен не тот Railway host

### 2. Перепутали `parent-med` и `PillPath`

Нормальная схема:
- инфраструктура и домены у нас сейчас `parent-med-*`
- branding и mobile bundle местами всё ещё `PillPath`

### 3. Поменяли env без пересборки фронта

Симптом:
- env уже исправлен
- приложение всё ещё ходит в старый URL

Причина:
- `VITE_*` уже были зашиты в старый bundle

### 4. Использовали private DB host с локальной машины

Симптом:
- DataGrip / psql не подключаются

Причина:
- использован `railway.internal`

Решение:
- брать `DATABASE_PUBLIC_URL`

## Что читать дальше

Если задача касается самой модели данных и сущностей:
- [DATABASE_ARCHITECTURE.md](/Users/artem/project/parent-med/docs/DATABASE_ARCHITECTURE.md:1)
