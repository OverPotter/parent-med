# Dev Testing Notes

Короткая памятка по dev-инструментам, которые уже встроены в приложение для ручного тестирования.

## Invite Flow

### 1. Обычный invite link в Family

Где:
- `Family` -> карточка `Invite to the app`

Что делает:
- создаёт обычный семейный invite;
- показывает и копирует реальный `join-family?token=...` URL;
- link в dev-среде должен собираться на dev frontend origin `https://192.168.0.160:5173`, если app работает против локального API.

Когда использовать:
- основной сценарий теста invite-flow;
- если нужно проверить настоящий invite token;
- если нужно пройти сценарий, максимально близкий к production.

Как тестировать:
1. На устройстве A зайти под owner-аккаунтом.
2. В `Family` нажать `Invite`.
3. Скопировать обычный invite link.
4. Открыть этот URL на устройстве B.

Какие сценарии покрывает:
- app не установлена;
- app установлена, но пользователь не залогинен;
- app установлена и пользователь уже залогинен.

### 2. Dev latest invite

Где:
- `Family` -> dev-карточка `Dev: latest invite`

Что делает:
- показывает dev URL `.../join-family?dev-latest=1`;
- копирует этот dev URL;
- даёт shortcut `Open latest invite` внутри app;
- работает с последним активным invite в локальной dev-базе, даже если invite был создан на другом аккаунте или другом симуляторе.

Когда использовать:
- когда нет удобного доступа к реальному copied token-link;
- когда нужно быстро открыть последний invite на другом симуляторе;
- когда тестируем invite-flow через одну локальную dev-базу и один локальный backend.

Важно:
- это dev shortcut, а не production universal link;
- он обходит момент физического получения ссылки, но дальше ведёт в реальный `JoinFamilyPage`;
- backend должен быть локальный/dev.

Какие сценарии удобно тестировать:
- app нет на телефоне;
- app установлена, но закрыта;
- app открыта, но пользователь не залогинен.

## Join Family Page

### 1. Реальный invite token

URL вида:

```text
/join-family?token=...
```

Поведение:
- открывает preview конкретного invite;
- даёт production-like flow;
- нужен для проверки, что конкретная invite-ссылка валидна.

### 2. Dev latest invite

URL вида:

```text
/join-family?dev-latest=1
```

Поведение:
- открывает preview последнего активного invite;
- нужен как dev-only shortcut;
- полезен для smoke-тестов и кросс-симуляторных сценариев.

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
