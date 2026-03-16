# Parent Med

Монорепозиторий: умная аптечка и ведение болезни ребёнка (MVP). Правила и стиль — в [AGENT.md](./AGENT.md).

## Состав

| Часть | Путь | Стек |
|-------|------|------|
| **Backend** | [backend/](./backend) | FastAPI, Python 3.11+, uv, SQLAlchemy 2 (async), Alembic |
| **Frontend** | [frontend/](./frontend) | Vite, React, TypeScript, PWA, Tailwind, Zustand, TanStack Query |

## Makefile

В корне: `make help` — список команд. Основное:

- `make up` / `make up-d` — Docker (все сервисы)
- `make down` / `make down-v` — остановка (с удалением volumes)
- `make migrate` — миграции БД
- `make format` — форматирование кода (backend: black + ruff, frontend: prettier)
- `make lint` — проверка стиля
- `make test` — тесты backend
- `make dev-backend` / `make dev-frontend` — разработка без Docker
- `make init` — копирование .env.example в .env

## Запуск

1. **Бэкенд**: PostgreSQL, миграции, API на порту 8000.
   ```bash
   cd backend && uv sync && cp .env.example .env && uv run alembic upgrade head && uv run python main.py
   ```
2. **Фронтенд**: dev-сервер с прокси к API (порт 5173).
   ```bash
   cd frontend && npm install && npm run dev
   ```

- Фронт: <http://localhost:5173>
- API: <http://localhost:8000>, документация: <http://localhost:8000/docs>

## Docker

В корне проекта: `docker-compose.yml` (PostgreSQL, backend, frontend). Стиль как в Tennly: образы собираются из `backend/docker/Dockerfile` и `frontend/docker/Dockerfile`, entrypoint бэкенда — `backend/docker/entrypoint.sh` (ожидание PostgreSQL, миграции, uvicorn).

```bash
# Сборка и запуск
docker compose up -d --build

# Фронт с прокси к API: http://localhost:3000
# API напрямую: http://localhost:8000
```

Перед первым запуском создайте `backend/.env` (можно скопировать из `backend/.env.example`). В compose в backend передаётся `DATABASE_URL` на контейнер `postgres`; при необходимости задайте там свои пароли.

Переопределения для локальной разработки — в `docker-compose.override.yml` (файл в .gitignore).

Подробности — в [backend/README.md](./backend/README.md) и [frontend/README.md](./frontend/README.md).
