# Docs Index

Единый индекс документации проекта.

## 1. Core Docs

Читать в таком порядке:

1. [APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)
2. [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
3. [PROJECT_STATUS.md](./PROJECT_STATUS.md)
4. [DEVELOPMENT_GUARDRAILS.md](./DEVELOPMENT_GUARDRAILS.md)

## 2. Detailed Product Logic

- [../SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)
  - detailed matrix for subscription, downgrade, children, pillbox, live activities, family roles

## 3. Operational Docs

- [PROJECT_MAP.md](./PROJECT_MAP.md)
  - domains, environments, Railway, local/mobile build notes
- [DEV_TESTING.md](./DEV_TESTING.md)
  - dev invite flows, RevenueCat sandbox tools, and manual testing shortcuts
- [APP_MIGRATION_TODO.md](./APP_MIGRATION_TODO.md)
  - App Store / mobile migration backlog
- [APP_STORE_REVIEW_NOTES.md](./APP_STORE_REVIEW_NOTES.md)
  - review notes template for App Store Connect
- [FAMILY_TRANSFER_INVITE_PLAN.md](./FAMILY_TRANSFER_INVITE_PLAN.md)
  - plan for destructive join flow when the current solo-family already has data

## 4. Module Readmes

- [../backend/README.md](../backend/README.md)
- [../frontend/README.md](../frontend/README.md)

## 5. Module-Local Notes

These files stay next to their modules on purpose:

- [../backend/docs/PILLBOX_API_DESIGN.md](../backend/docs/PILLBOX_API_DESIGN.md)
- [../frontend/ios/LIVE_ACTIVITIES_ARCHITECTURE.md](../frontend/ios/LIVE_ACTIVITIES_ARCHITECTURE.md)
- [../frontend/design/README.md](../frontend/design/README.md)

## 6. Documentation Rules

- root `README.md` is the repo entry point
- shared project docs live in `docs/`
- module-specific notes stay in `backend/README.md` and `frontend/README.md`
- module-local design/iOS/backend implementation notes may stay inside their modules
- `SUBSCRIPTION_ROLLOUT_PLAN.md` stays in root because it is the detailed rollout source of truth
