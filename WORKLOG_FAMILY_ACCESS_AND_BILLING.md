# Family Access / Billing Worklog

Дата фиксации: 2026-04-22
Ветка: `feature/family-access-billing-plan`

## Что уже реализовано

### 1. Новая модель семьи
- Убрана продуктовая модель `owner/member` в пользу `admin/member`.
- Данные семьи живут на `family_id`.
- Добавлен `billing_account_id` у семьи как основа под billing owner.

### 2. Гранулярные права доступа
- У участника семьи есть `access_policy`.
- Поддерживаются:
  - `all_children`
  - `child_ids`
  - `children_access = view | edit`
  - `cabinet_access = none | view | edit`
  - `pillbox_access = none | view | act | edit`
  - `illness_push_enabled`
  - `cabinet_push_enabled`
  - `pillbox_push_enabled`

### 3. Важная бизнес-логика прав
- `admin` больше не имеет безусловного доступа к детям, аптечке и приёмам.
- `admin` даёт права только на family-management:
  - invite links
  - роли
  - доступы
  - family settings
- Свой собственный доступ к детям / cabinet / pillbox админ тоже может ограничить.

### 4. Дети
- Если пользователь не выбран в доступе к ребёнку, ребёнок для него полностью скрыт.
- Журнал и наблюдения наследуются от доступа к ребёнку.
- Если `children_access = view`, ребёнка можно только смотреть.
- Если `children_access = edit`, можно редактировать и вести журнал.
- Если `child_ids` пустой и `all_children = false`, пользователь не видит детей и журнал вообще.

### 5. Family settings / management children
- Для family settings сделан отдельный admin-only список детей:
  - backend route: `/children/management`
  - используется только для настройки прав
- Это отделено от обычного пользовательского `/children`, который режется личным `access_policy`.
- Исправлен баг, когда в настройках сначала показывался 1 ребёнок, а потом появлялись остальные:
  - причина была в смешении management-списка и обычного children query cache
  - теперь для management используется отдельный query key

### 6. Family UI
- `FamilyPage` упрощён:
  - список участников
  - invite section
  - family name section
- Настройки доступа вынесены на отдельный экран:
  - route: `/family/members/:memberAccountId/access`
- Новый экран:
  - `frontend/src/client/pages/FamilyMemberAccessPage.tsx`
- Editor вынесен в:
  - `frontend/src/client/pages/family/MemberAccessEditor.tsx`

### 7. Sleep / Feeding
- Active session видят все как shared data.
- Управлять active session может только инициатор.
- Live Activity только у инициатора.
- Backend и frontend проверки добавлены.

### 8. Illness Live Activity
- Illness live activity shared по recipients эпизода.
- Если `memberAccountIds` пустой список, трактуется как "вся семья".
- Пока контент минимальный: ребёнок / эпизод / день болезни.

### 9. Billing foundation
- У семьи добавлен subscription state:
  - `plan_code`
  - `subscription_status`
  - `subscription_provider`
  - `subscription_product_id`
  - `subscription_expires_at`
  - `premium_active`
- Пока gating по тарифам не включён.
- RevenueCat sync ещё не внедрён.

### 10. Pillbox special-case: `act`
- Добавлен отдельный уровень прав:
  - `pillbox_access = act`
- Смысл:
  - видит раздел приёмов
  - может отметить приём
  - не может создавать / редактировать / удалять планы
- Серверная логика:
  - `list/get/history-summary` требуют `view`
  - `log_dose` требует `act`
  - `create/update/delete` требуют `edit`
- UI логика:
  - при `act` есть кнопка отметить приём
  - create/edit/delete недоступны

### 11. Pillbox push rule
- Введено правило:
  - `pillbox_push_enabled = true` допустим только при `pillbox_access = act | edit`
- Комбинации `view + push` и `none + push` запрещены серверно.
- В family access editor есть UI-подсказка про это ограничение.

## Что уже проверено

### Backend
- Тесты:
  - `backend/tests/test_family_access_services.py`
  - `backend/tests/test_family_service.py`
- Последний зелёный прогон:
  - `uv run pytest tests/test_family_access_services.py tests/test_family_service.py -q`

### Frontend
- Типы:
  - `npx tsc --noEmit`
- Последний зелёный прогон был после внедрения `pillbox act`.

## Важные продуктовые решения, которые уже зафиксированы

### Семья
- `admin` управляет семьёй и правами.
- Участникам выдаются индивидуальные права, а не общая роль “всё/ничего”.

### Доступы
- `children` управляются отдельно от `cabinet`.
- `pillbox` управляется отдельно от `children`.
- Бабушке/няне можно не показывать детей и аптечку, но дать доступ только к приёмам.

### Push
- По `pillbox` push не должен приходить тому, кто не может совершить действие.
- Поэтому для operational reminders нужен минимум `act`.

### Live Activity
- `sleep/feeding`: personal
- `illness`: shared по recipients

## На чём остановились

Остановились после внедрения `pillbox_access = act`.

То есть прямо сейчас свежая точка такая:
- модель прав уже достаточно зрелая
- family settings вынесены на отдельный экран
- `pillbox act` внедрён серверно и фронтово
- push-ограничение для pillbox тоже внедрено

## Что проверить руками следующим шагом

### Pillbox roles QA
1. `pillbox = view`
- раздел виден
- кнопки create/edit/delete нет
- кнопку отметить приём нельзя нажать

2. `pillbox = act`
- раздел виден
- кнопка отметить приём есть
- edit/create/delete нет

3. `pillbox = act + pillbox push = true`
- настройки сохраняются
- push по приёмам приходит
- по tap можно зайти и отметить лекарство

4. `pillbox = view + pillbox push = true`
- backend должен отклонять сохранение

### Family access QA
1. Выдать доступ к одному ребёнку
- виден только он
- остальные скрыты

2. Выдать `children = view`
- профиль и журнал открываются
- edit CTA не должны работать

3. Скрыть cabinet
- аптечка должна исчезать сразу

## Что логично делать дальше

Следующие разумные варианты:

### Вариант A. Device QA и добивка багов
- руками прогнать роли и переходы
- ловить реальные UX/permission edge cases

### Вариант B. RevenueCat sync
- связать RevenueCat entitlement с `family subscription state`
- пока без feature gating

### Вариант C. Дополировать family UX
- ещё почистить тексты
- spacing / section hierarchy
- возможно presets прав позже

## Ключевые файлы

### Backend
- `backend/src/application/services/family_service.py`
- `backend/src/application/services/access_control.py`
- `backend/src/application/services/pillbox_service.py`
- `backend/src/application/services/child_service.py`
- `backend/src/domain/entities/family_access.py`
- `backend/src/application/dto/family_access.py`
- `backend/src/api/routers/children.py`
- `backend/tests/test_family_access_services.py`
- `backend/tests/test_family_service.py`

### Frontend
- `frontend/src/client/pages/FamilyPage.tsx`
- `frontend/src/client/pages/FamilyMemberAccessPage.tsx`
- `frontend/src/client/pages/family/MemberCard.tsx`
- `frontend/src/client/pages/family/MemberAccessEditor.tsx`
- `frontend/src/client/pages/PillboxPage.tsx`
- `frontend/src/client/pages/pillbox/hubScreen.tsx`
- `frontend/src/shared/permissions/familyAccess.ts`
- `frontend/src/shared/types/api.ts`
- `frontend/src/shared/types/transform.ts`
- `frontend/src/client/layout/ClientLayout.tsx`
- `frontend/src/App.tsx`
