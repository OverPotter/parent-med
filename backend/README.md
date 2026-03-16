# Parent Med Backend (MVP)

Бэкенд в стиле AGENT.md: умная аптечка и ведение болезни ребёнка.

## Стек

- Python ≥ 3.11, **uv** (зависимости)
- FastAPI, SQLAlchemy 2 (async), asyncpg, Pydantic, Alembic
- Слои: `api/`, `application/`, `domain/`, `infrastructure/`, `core/`

## Быстрый старт

```bash
# из корня репозитория
cd backend

# зависимости (uv)
uv sync

# .env (скопировать из .env.example и при необходимости поправить)
cp .env.example .env

# миграции (нужен запущенный PostgreSQL)
uv run alembic upgrade head

# запуск API
uv run python main.py
# или: uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- API: <http://localhost:8000>
- Документация: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

## MVP: эндпоинты

| Домен | Префикс | Описание |
|-------|---------|----------|
| Семьи | `GET/POST/PATCH/DELETE /api/v1/families` | CRUD семьи |
| Дети | `GET/POST/PATCH/DELETE /api/v1/children`, `GET /api/v1/children?family_id=...` | CRUD, список по семье |
| Вес | `GET/POST/DELETE /api/v1/weight-entries`, `GET ...?child_id=...`, `GET .../child/{id}/latest` | Журнал веса |
| Справочник препаратов | `GET/POST/DELETE /api/v1/medicine-catalog`, `GET ...?name=...` | Поиск по названию |
| Аптечка | `GET/POST/PATCH/DELETE /api/v1/household-medicines`, `GET ...?family_id=...` | Упаковки, вскрытие |
| Эпизоды болезни | `GET/POST/PATCH/DELETE /api/v1/illness-episodes`, `GET ...?child_id=...`, `GET .../child/{id}/active` | Эпизоды, активный |
| Температура | `GET/POST/DELETE /api/v1/temperature-entries`, `GET ...?episode_id=...` | Журнал температуры |
| Приёмы лекарств | `GET/POST/DELETE /api/v1/administration-events`, `GET ...?episode_id=...` | Журнал приёмов (с проверкой Safety Engine) |

## Safety Engine

При создании приёма (`POST /api/v1/administration-events`) проверяются:

- срок годности упаковки (просрочен → блокировка);
- срок после вскрытия (по умолчанию 30 дней) — превышен → блокировка.

## Форматирование и линт

```bash
uv run black src --line-length 100
uv run ruff check src --exclude alembic
uv run ruff format src
```
