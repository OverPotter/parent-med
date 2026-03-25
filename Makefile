# Parent Med — см. make help

COMPOSE ?= docker compose
COMPOSE_ENV_FILE := $(shell test -f frontend/.env && echo --env-file frontend/.env)
DOCKER_COMPOSE := $(COMPOSE) $(COMPOSE_ENV_FILE) -f docker-compose.yml

.PHONY: help format lint test up up-d down down-v logs logs-backend logs-hitkeep build-frontend
.PHONY: up-db up-db-d up-api up-api-d migrate migrate-create migrate-downgrade
.PHONY: dev-backend dev-frontend shell-backend shell-db backup init

help:
	@echo "Parent Med"
	@echo "  make up / up-d     — docker: postgres, backend, frontend, hitkeep (8080)"
	@echo "  make down / down-v — остановка; -v удалит volumes (БД, логи, hitkeep)"
	@echo "  make logs          — логи всех сервисов; logs-backend / logs-hitkeep — один"
	@echo "  make up-db / up-api — только postgres или postgres+backend"
	@echo "  make build-frontend — пересборка фронта (VITE_* из frontend/.env при наличии)"
	@echo "  make migrate | migrate-create name=... | migrate-downgrade"
	@echo "  make dev-backend | dev-frontend | format | lint | test | init | backup"

up:
	$(DOCKER_COMPOSE) up --build --remove-orphans

up-d:
	$(DOCKER_COMPOSE) up --build --remove-orphans -d

down:
	$(DOCKER_COMPOSE) down

down-v:
	$(DOCKER_COMPOSE) down -v

logs:
	$(DOCKER_COMPOSE) logs -f

logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

logs-hitkeep:
	$(DOCKER_COMPOSE) logs -f hitkeep

build-frontend:
	$(DOCKER_COMPOSE) build --no-cache frontend

up-db:
	$(DOCKER_COMPOSE) up --remove-orphans postgres

up-db-d:
	$(DOCKER_COMPOSE) up --remove-orphans -d postgres

up-api:
	$(DOCKER_COMPOSE) up --build --remove-orphans postgres backend

up-api-d:
	$(DOCKER_COMPOSE) up --build --remove-orphans -d postgres backend

migrate:
	$(DOCKER_COMPOSE) exec backend uv run alembic upgrade head

migrate-create:
	$(DOCKER_COMPOSE) exec backend uv run alembic revision --autogenerate -m "$(name)"

migrate-downgrade:
	$(DOCKER_COMPOSE) exec backend uv run alembic downgrade -1

shell-db:
	$(DOCKER_COMPOSE) exec postgres psql -U parent_med_user parent_med

dev-backend:
	cd backend && uv sync && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm install && npm run dev

format:
	cd backend && uv run black src tests && uv run ruff check src tests --fix
	cd frontend && npm run format

lint:
	cd backend && uv run black --check src tests && uv run ruff check src tests
	cd frontend && npm run lint

test:
	cd backend && uv run pytest -v

shell-backend:
	$(DOCKER_COMPOSE) exec backend /bin/bash

backup:
	$(DOCKER_COMPOSE) exec postgres pg_dump -U parent_med_user parent_med > backup_$$(date +%Y%m%d_%H%M%S).sql

init:
	cp backend/.env.example backend/.env 2>/dev/null || true
	cp frontend/.env.example frontend/.env 2>/dev/null || true
	@echo "Готово: проверьте .env"
