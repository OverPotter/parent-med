# Parent Med — умная аптечка и ведение болезни ребёнка
# Запуск: make help

.PHONY: help format lint test up up-d down down-v migrate migrate-create migrate-downgrade logs logs-backend
.PHONY: dev-backend dev-frontend shell-backend shell-db backup init

help:
	@echo "Parent Med — умная аптечка 🏥"
	@echo ""
	@echo "Доступные команды:"
	@echo "  make up              - Запуск всех сервисов (Docker)"
	@echo "  make up-d            - Запуск в фоне"
	@echo "  make down            - Остановка всех сервисов"
	@echo "  make down-v          - Остановка и удаление volumes"
	@echo "  make logs            - Просмотр логов"
	@echo "  make logs-backend    - Логи только бэкенда"
	@echo "  make migrate         - Применение миграций БД"
	@echo "  make migrate-create  - Создание новой миграции (name=...)"
	@echo "  make migrate-downgrade - Откат последней миграции"
	@echo "  make format          - Форматирование кода"
	@echo "  make lint            - Проверка стиля кода"
	@echo "  make test            - Запуск тестов"
	@echo "  make dev-backend     - Запуск бэкенда для разработки"
	@echo "  make dev-frontend    - Запуск фронтенда для разработки"
	@echo "  make shell-backend   - Консоль бэкенда"
	@echo "  make shell-db        - Консоль PostgreSQL"
	@echo "  make backup         - Дамп БД в backup_YYYYMMDD_HHMMSS.sql"
	@echo "  make init           - Копирование .env.example в .env"

# ========== Docker ==========
up:
	docker compose up --build --remove-orphans

up-d:
	docker compose up --build --remove-orphans -d

down:
	docker compose down

down-v:
	docker compose down -v

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

# ========== Database ==========
migrate:
	docker compose exec backend uv run alembic upgrade head

migrate-create:
	docker compose exec backend uv run alembic revision --autogenerate -m "$(name)"

migrate-downgrade:
	docker compose exec backend uv run alembic downgrade -1

shell-db:
	docker compose exec postgres psql -U parent_med_user parent_med

# ========== Development ==========
dev-backend:
	cd backend && uv sync && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm install && npm run dev

# ========== Code Quality ==========
format:
	cd backend && uv run black src tests && uv run ruff check src tests --fix
	cd frontend && npm run format

lint:
	cd backend && uv run black --check src tests && uv run ruff check src tests
	cd frontend && npm run lint

test:
	cd backend && uv run pytest -v

# ========== Utils ==========
shell-backend:
	docker compose exec backend /bin/bash

backup:
	docker compose exec postgres pg_dump -U parent_med_user parent_med > backup_$$(date +%Y%m%d_%H%M%S).sql

# ========== Initial Setup ==========
init:
	cp backend/.env.example backend/.env 2>/dev/null || true
	cp frontend/.env.example frontend/.env 2>/dev/null || true
	@echo "✅ Файлы .env созданы. Отредактируйте их перед запуском."
