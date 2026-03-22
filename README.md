# Parent Med

Монорепозиторий: аптечка и ведение болезни ребёнка (MVP). Детали — [AGENT.md](./AGENT.md).

| Часть | Путь | Стек |
|-------|------|------|
| Backend | [backend/](./backend) | FastAPI, uv, SQLAlchemy async, Alembic |
| Frontend | [frontend/](./frontend) | Vite, React, TS, PWA, Tailwind, Zustand, TanStack Query |

## Команды

`make help` — полный список. Часто нужное:

- `make up` / `make up-d` — Docker: PostgreSQL, API :8000, фронт :3000, **HitKeep** :8080
- `make down` / `make down-v` — остановка; `-v` сотрёт volumes
- `make up-db` / `make up-api` — только БД или БД+backend (без контейнера фронта)
- `make build-frontend` — пересборка фронта (`frontend/.env` подхватывается Makefile’ом для `VITE_*`)
- `make migrate` — миграции; `make dev-backend` / `make dev-frontend` — без Docker

## Локально без Docker

```bash
cd backend && uv sync && cp .env.example .env && uv run alembic upgrade head && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
cd frontend && npm install && npm run dev
```

Фронт: http://localhost:5173 · API: http://localhost:8000 · `/docs`

## Docker

Один файл: [docker-compose.yml](./docker-compose.yml). Образы: `backend/docker/Dockerfile`, `frontend/docker/Dockerfile`, HitKeep: [docker/hitkeep/Dockerfile](./docker/hitkeep/Dockerfile) (обёртка над upstream с `chmod` на бинарник).

```bash
docker compose up -d --build
```

Перед запуском: `backend/.env` из `backend/.env.example`. Переопределения — `docker-compose.override.yml` (в .gitignore).

Подробнее: [backend/README.md](./backend/README.md), [frontend/README.md](./frontend/README.md).

## HitKeep

- Скрипт: `VITE_HITKEEP_SCRIPT_URL` (например `http://localhost:8080/hk.js`) — см. `frontend/.env.example`.
- Дашборд: http://localhost:8080 · домен сайта в UI — hostname вида `что-то.зона`, не `localhost` без точки; удобно `parent-med.localhost`.
- Прод (Railway и т.д.): отдельный сервис HitKeep, том на `/var/lib/hitkeep/data`, переменные `HITKEEP_PUBLIC_URL`, `HITKEEP_JWT_SECRET`, `HITKEEP_HTTP_ADDR=:$PORT`; фронт собирать с тем же `VITE_HITKEEP_SCRIPT_URL`.
