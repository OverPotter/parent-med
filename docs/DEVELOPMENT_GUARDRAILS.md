# Development Guardrails

Это короткий operational-документ про то, что нельзя ломать или тихо убирать без отдельного согласования.

## 1. Не удалять и не переписывать `.env` без явного согласования

Правило:

- любые изменения в `backend/.env`, `frontend/.env*` и похожих локальных env-файлах делать только осознанно
- не удалять локальные env-файлы автоматически
- не подменять рабочие локальные значения без прямого запроса или явного согласования

Почему:

- локальная разработка и mobile-dev завязаны на конкретные `VITE_*`, `DATABASE_URL`, dev API origins и test keys
- случайная правка env часто выглядит как “приложение сломалось само”, хотя реально разъехалась конфигурация

## 2. Любые рискованные конфигурационные правки — только с подтверждением

Особенно это касается:

- `.env`
- mobile build mode
- iOS/Capacitor runtime config
- billing/test flags
- production domains / public URLs
- push config / APNS / VAPID keys

Если изменение может сломать локальную разработку, тестовый flow или device QA, его нельзя проводить “между делом”.

## 3. В dev-сборке есть test-only UI и helper flow

Сейчас в development/mobile-dev сборках могут существовать временные тестовые элементы.

Их задача:

- ускорять ручное тестирование
- не ждать реальных lifecycle-событий
- обходить неудобства симуляторов и локальной среды

### Примеры dev-only элементов

- `Settings -> RevenueCat sandbox`
- `Force free mode`
- `Resume RevenueCat sync`
- dev-блоки для invite/testing в семейном модуле
- дополнительные debug/test entry points для push/live activities, если они включены в текущей dev-сборке

## 4. Dev-only элементы не должны попасть в production

Правило:

- всё test-only должно быть удалено, либо надёжно скрыто перед релизом
- production UX не должен зависеть от debug flows
- release smoke-test должен отдельно проверять, что dev-only controls не видны пользователю

## 5. Что считать обязательным release-check

Перед релизом нужно проверить:

- нет ли `RevenueCat sandbox` UI
- нет ли test-only invite shortcut
- нет ли debug push/live-activity controls
- нет ли mobile-dev текстов, заглушек и временных обходов
- production subscription CTA ведут в production flow, а не в dev/test сценарии

## 6. Где фиксировать такие вещи

Если появляется новый test-only flow:

- его нужно явно записывать в [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- если он относится к подписке/downgrade/billing — также в [SUBSCRIPTION_ROLLOUT_PLAN.md](../SUBSCRIPTION_ROLLOUT_PLAN.md)

Этот документ не заменяет rollout docs, а фиксирует общее правило:

`dev tooling допустим, но не должен незаметно становиться частью production продукта`
