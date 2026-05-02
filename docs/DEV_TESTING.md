# Dev Testing Notes

Короткая памятка по dev-инструментам, которые уже встроены в приложение для ручного тестирования.

## Family Invite Code

### 1. Основной flow в Family

Где:
- `Family` -> карточка `Family invite code`

Что делает:
- создаёт обычный семейный invite;
- показывает и копирует одноразовый код;
- код живёт ограниченное время и сгорает после успешной регистрации.

Когда использовать:
- основной сценарий теста invite-flow;
- если нужно проверить настоящий invite token;
- если нужно пройти сценарий, максимально близкий к production.

Как тестировать:
1. На устройстве A зайти под owner-аккаунтом.
2. В `Family` нажать `Create code`.
3. Скопировать код.
4. На устройстве B открыть app, перейти в регистрацию и вставить код в блок `Есть код семьи`.

Какие сценарии покрывает:
- app уже установлена;
- пользователь создаёт новый аккаунт;
- пользователь проверяет код до submit регистрации.

## RevenueCat Sandbox

Где:
- `Settings` -> `RevenueCat sandbox`

Для чего нужен:
- ручной dev smoke test native RevenueCat в iOS sandbox;
- проверка configure / offerings / purchase / restore / snapshot;
- ручной reset/free-mode перед повторным тестом.

Кнопки:
- `Open test paywall`
  - открыть тестовый paywall внутри app.
- `Configure`
  - инициализировать native RevenueCat для текущего account id.
- `Offerings`
  - загрузить текущие offerings и packages.
- `Buy monthly`
  - купить monthly sandbox package.
- `Buy annual`
  - купить annual sandbox package.
- `Restore`
  - восстановить sandbox purchases.
- `Snapshot`
  - получить текущий customer snapshot из RevenueCat.
- `Reset to free`
  - сбросить локальное billing/debug состояние обратно в free.
- `Force free mode`
  - временно подавить RevenueCat sync для текущего аккаунта.
- `Resume RevenueCat sync`
  - снять подавление sync и вернуть обычную интеграцию.

Важно:
- это dev-only/manual tooling;
- не удалять без замены процесса ручного тестирования;
- блок нужен именно для iOS sandbox-проверок до реального production rollout.

## Reminder / Notification Pickers

Текущее правило для picker-ов с участниками:
- первая строка: имя;
- вторая строка: только роль/отношение;
- email/логин в secondary text не показываем.

Это правило сейчас уже применено в:
- illness notifications;
- pillbox notifications;
- medicine cabinet notifications;
- выборе `для кого план`.
