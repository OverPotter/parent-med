# Правила для Cursor (стиль Tennly)

Краткий справочник по архитектуре и стандартам монорепозитория: Backend (FastAPI) + Frontend (React PWA). **Строго следовать этим правилам**, не придумывать свои.

---

## Общее

- **Документация и комментарии** — только на **русском**.
- **Имена** (переменные, функции, классы) — на **английском**: в Python — `snake_case`, в TypeScript — `camelCase`.
- **Принципы**: SOLID, DDD, Clean Architecture где уместно; DRY — без дублирования, общее в модули/хуки/утилиты.
- **Состав**: Backend (FastAPI, Python), Frontend (React, PWA).

---

## Backend (Python, FastAPI)

- **Зависимости**: uv (не `requirements.txt`). Python ≥ 3.11, везде type hints.
- **Форматирование**: Black (line-length=100), Ruff (линтер + isort). Исключать `alembic` из Ruff.

### Структура в `src/`

| Слой | Путь | Назначение |
|------|------|------------|
| Презентация | `api/` | Роуты (по файлу на домен, напр. `clients.py`), `deps/` (database, repositories, services, auth), middleware, utils (декоратор доменных исключений). |
| Приложение | `application/` | `services/` (файл на домен), `dto/` (Create/Update/Response DTO, Pydantic, `Field(..., description="...")` на русском), `requests/` (Request-модели эндпоинтов). |
| Домен | `domain/` | `entities/` (файл на сущность, без ORM), `repositories/` (абстракции от `BaseRepository[T]` + доменные методы). |
| Инфраструктура | `infrastructure/` | `database/models/` (SQLAlchemy, Mapped, одна модель на файл, докстринги на русском), `database/repositories/` (реализации с `_to_entity`/`_to_model`). |
| Ядро | `core/` | config (pydantic-settings из .env), exceptions (`TennlyException` + наследники с `code` и `status_code`), exception_handlers, logging, lifespan. |

### Поток данных

- **Запрос**: Request → Route → Request/DTO → Service → Repository (интерфейс) → Infrastructure Repository → DB.
- **Ответ**: Entity → Service (`_to_response`) → Response DTO.

### Валидация и ошибки

- Валидация только через Pydantic (`application/requests` и `dto`). Доменные исключения — отдельные классы в `core/exceptions`; в API — глобальный handler и/или декоратор → `HTTPException`.

### DI

- Репозитории и сервисы через FastAPI `Depends`; фабрики в `api/deps` (`get_*_repo`, `get_*_service`).

### БД

- SQLAlchemy 2 (async), asyncpg, Alembic. Не использовать зарезервированные имена (`metadata` и т.п. — переименовывать или `Column("metadata")`).

---

## Frontend (React, TypeScript, PWA)

- **Сборка**: Vite (не CRA). PWA: `vite-plugin-pwa` (manifest, service worker, установка на устройство).
- **TypeScript**: strict, без `any`. Алиасы: `@/`, `@admin/`, `@client/`, `@shared/` (в tsconfig и vite.config).

### Структура в `src/`

- `shared/` — api (один axios с baseURL и interceptors: Bearer, обработка 401), типы под ответы бэка, компоненты, хуки, утилиты.
- `admin/` — страницы и компоненты админки.
- `client/` — страницы и компоненты для пользователя.

### Роутинг и стейт

- React Router; разветвление по роли (admin/client) в одном месте (напр. `App.tsx`).
- **Zustand** — глобальный стейт (auth, тема); **TanStack Query** — серверный кэш и запросы к API.

### Стили

- **Tailwind**; темы через CSS-переменные и `data-theme` (светлая/тёмная). Адаптив: `min-w-0`, `truncate`, `sm:/md:/lg:`.

### Код

- Комментарии/JSDoc — на русском. Компоненты функциональные; переиспользуемое — в `shared`.

---

## Чего не делать

- Не менять стиль на свой: только описанная структура и именование.
- Не использовать Kafka и не усложнять стек без необходимости.

---

При запросах «сделай фичу X» или «добавь эндпоинт Y» выдавать код в этом стиле: те же папки и слои, русские докстринги и комментарии, `Field(..., description="...")` на русском, декораторы и deps как в Tennly.
