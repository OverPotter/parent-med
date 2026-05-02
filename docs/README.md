# Docs Index

Единая точка входа в документацию проекта.

Если нужно быстро понять проект целиком, читать в таком порядке:

1. [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
2. [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
3. [PROJECT_MAP.md](./PROJECT_MAP.md)
4. [DEVELOPMENT_GUARDRAILS.md](./DEVELOPMENT_GUARDRAILS.md)
5. [../SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)

## 1. Project Overview

- [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
  - продуктовые модули, роли, family model, подписка
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
  - схема БД, ключевые сущности и связи
- [PROJECT_MAP.md](./PROJECT_MAP.md)
  - environments, домены, Railway, env, локальный запуск

## 2. Module Docs

- [../backend/README.md](../backend/README.md)
  - backend setup, API, migrations, dev flow
- [../frontend/README.md](../frontend/README.md)
  - frontend setup, build modes, mobile/web flow

Module-local notes:

- [../backend/docs/PILLBOX_API_DESIGN.md](../backend/docs/PILLBOX_API_DESIGN.md)
- [../frontend/ios/LIVE_ACTIVITIES_ARCHITECTURE.md](../frontend/ios/LIVE_ACTIVITIES_ARCHITECTURE.md)
- [../frontend/design/README.md](../frontend/design/README.md)

## 3. Testing And Release

- [DEV_TESTING.md](./DEV_TESTING.md)
  - dev invite tooling, RevenueCat sandbox, manual dev scenarios
- [PROD_SMOKE_TEST_CHECKLIST.md](./PROD_SMOKE_TEST_CHECKLIST.md)
  - финальный production smoke checklist перед и после релиза
- [APP_STORE_REVIEW_NOTES.md](./APP_STORE_REVIEW_NOTES.md)
  - заметки для App Store review

## 4. Product Rules

- [../SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
  - правила подписки, downgrade и family access

## 5. Documentation Rules

- корневой [README.md](../README.md) — entry point репозитория
- общие документы проекта живут в `docs/`
- модульные инструкции живут рядом с модулями
- временные рабочие планы и TODO не держим в основной документации после завершения задачи
