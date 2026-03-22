# Parent Med Frontend (PWA)

Фронтенд по правилам AGENT.md: Vite, React, TypeScript, PWA, Tailwind, Zustand, TanStack Query.

## Стек

- **Сборка**: Vite (не CRA)
- **PWA**: vite-plugin-pwa (manifest, service worker, установка на устройство)
- **TypeScript**: strict, без any. Алиасы: `@/`, `@shared/`, `@admin/`, `@client/`
- **Роутинг**: React Router; разветвление по роли (admin/client) в `App.tsx`
- **Стейт**: Zustand (тема, семья, роль), TanStack Query (запросы к API)
- **Стили**: Tailwind; темы через CSS-переменные и `data-theme` (светлая/тёмная)

## Структура `src/`

- `shared/` — api (axios с baseURL, interceptors: Bearer, 401), типы, компоненты, store
- `admin/` — страницы и layout админки (MVP: заглушка)
- `client/` — страницы и layout для пользователя (семья, дети, аптечка, эпизоды болезни)

## Запуск

```bash
# из корня репозитория
cd frontend
npm install
npm run dev
```

- Приложение: <http://localhost:5173>
- Прокси к API: `/api` → `http://localhost:8000` (запустите бэкенд отдельно)

## Сборка PWA

```bash
npm run build
npm run preview
```

После сборки в `dist/` — статика и service worker для установки на устройство.

## Аналитика (HitKeep)

Код: `src/shared/analytics/`. Без `VITE_HITKEEP_SCRIPT_URL` в `.env` скрипт не грузится.

- **`VITE_HITKEEP_SCRIPT_URL`** — URL `hk.js` (после `make up` HitKeep на :8080: `http://localhost:8080/hk.js`).
- **`VITE_HITKEEP_USER_HASH_SALT`** — опционально, соль для хешей id в событиях.

Частые проблемы:

- **`localhost` / `127.0.0.1` в адресе** — в `hk.js` отправка отключена; заходите как **`http://parent-med.localhost:5173`** (или :3000), в HitKeep сайт с доменом **`parent-med.localhost`**, CORS в `backend/.env`.
- **Docker-фронт без событий** — `VITE_*` только на **сборке**; задайте в `frontend/.env`, в корне `make` передаёт `--env-file frontend/.env`, затем `make build-frontend` или пересборка образа.
- **Domain в UI HitKeep** — только hostname (`метка.зона`), без `http://` и без порта; `localhost` без точки не пройдёт валидацию.

Локально: `make up` из корня репозитория (HitKeep в общем `docker-compose.yml`), дашборд http://localhost:8080. Прод: см. корневой `README.md`.
