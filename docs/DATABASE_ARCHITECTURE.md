# Database Architecture

Актуально для текущей схемы после medicine-rollout, snapshot-only перехода и cleanup-миграции `057_clear_medicine_data`.

## Суть модели

Сейчас лекарственный домен разделён на два независимых слоя:

1. `curated_medicine_catalog_items`
- общий нормализованный каталог
- нужен только для поиска и выбора
- наполняется seed-скриптом
- не хранит пользовательские упаковки

2. `household_medicines`
- пользовательская аптечка семьи
- хранит snapshot выбранного препарата
- не зависит от старого raw-каталога
- используется напоминаниями, журналом приёмов и pillbox

Старый raw-каталог `medicine_catalog_items` удалён. Связь `household_medicines.catalog_item_id` тоже удалена.

## Картина целиком

Упрощённо связи сейчас такие:

```text
accounts ── belongs to ──> families
children ── belongs to ──> families
family_invites ── belongs to ──> families

curated_medicine_catalog_items
    └─ используется только как источник выбора

household_medicines ── belongs to ──> families
    ├─ episode_medication_plans -> household_medicine_id
    ├─ administration_events -> household_medicine_id
    └─ pillbox_medications / pillbox_plans используют snapshot-данные аптечки

families
    ├─ owner_account_id
    ├─ billing_account_id
    ├─ free_primary_child_id
    ├─ free_primary_pillbox_plan_id
    ├─ plan_code / subscription_status
    └─ cabinet_member_account_ids
```

Главный принцип: runtime работает от `household_medicines`, а не от живого каталога.

## Главные сущности

### `accounts`
Пользователи.

Ключевые поля:
- `id`
- `email`
- `family_id`
- `display_name`
- `preferred_language`
- `family_role`

### `families`
Семейный контекст.

Ключевые поля:
- `id`
- `name`
- `owner_account_id`
- `billing_account_id`
- `plan_code`
- `subscription_status`
- `subscription_provider`
- `subscription_product_id`
- `subscription_expires_at`
- `free_primary_child_id`
- `free_primary_pillbox_plan_id`
- `cabinet_member_account_ids`

Важно:
- семья — главный контейнер данных продукта
- подписка считается на уровне семьи
- `owner_account_id` определяет владельца семьи
- downgrade-сценарии держатся на `free_primary_*` якорях

### `curated_medicine_catalog_items`
Нормализованный каталог лекарств.

Назначение:
- поиск по справочнику
- автоподстановка данных в аптечку
- хранение типовых справочных данных

Ключевые поля:
- `id`
- `language`
- `display_name`
- `active_substance`
- `form`
- `strength`
- `short_description`
- `dosage_summary`
- `default_opened_shelf_days`
- `pediatric_dose_mg_per_kg_min`
- `pediatric_dose_mg_per_kg_max`
- `pediatric_dose_note`
- `is_otc`
- `is_home_cabinet_relevant`
- `search_rank`

Важно:
- это не пользовательские данные
- записи приходят из seed-источника
- по состоянию продовой БД сейчас в таблице `676` записей

### `household_medicines`
Аптечка семьи.

Назначение:
- реальные упаковки, которыми пользуется семья
- snapshot из каталога или вручную введённого препарата

Ключевые поля:
- `id`
- `family_id`
- `expiry_date`
- `opened_at`
- `opened_shelf_days`
- `storage_place`
- `comment`
- `medicine_name`
- `medicine_form`
- `medicine_category`
- `medicine_concentration`
- `medicine_description`
- `medicine_dosage`
- `pediatric_dose_mg_per_kg_min`
- `pediatric_dose_mg_per_kg_max`
- `pediatric_dose_note`

Важно:
- `medicine_form` хранит реальную форму упаковки
- `medicine_category` используется для ручного препарата
- `catalog_item_id` больше нет
- аптечка больше не зависит от FK на каталог

### `episode_medication_plans`
Напоминания по лекарствам внутри эпизода болезни.

Назначение:
- план приёма по болезни ребёнка
- хранение итоговой дозы и расчётных данных

Ключевые поля:
- `id`
- `episode_id`
- `household_medicine_id`
- `custom_medicine_name`
- `dose_amount`
- `min_interval_minutes`
- `max_doses_per_day`
- `weight_kg`
- `dose_mg_per_kg`
- `calculated_dose_mg`
- `calculated_dose_value`
- `calculated_dose_unit`
- `dose_calc_mode`
- `dose_calc_warning`
- `manual_dose_override`

Важно:
- напоминание использует данные из аптечки
- итоговая доза остаётся пользовательским значением

### `administration_events`
Факты приёма лекарства.

Назначение:
- журнал того, что реально дали ребёнку

Ключевые поля:
- `id`
- `episode_id`
- `household_medicine_id`
- `custom_medicine_name`
- `dose_amount`
- `administered_at`

### `pillbox_plans`
Планы приёма в pillbox.

Ключевые поля:
- `id`
- `family_id`
- `title`
- `status`
- `member_account_ids`

Важно:
- при downgrade один план может остаться `free_primary_pillbox_plan_id`
- остальные активные/paused планы архивируются

### `pillbox_medications`
Лекарства внутри плана pillbox.

### `pillbox_dose_logs`
Логи доз в pillbox.

## Базовые продуктовые правила

### 0. Семья — основная граница данных

Все основные сущности продукта scoped to `family`:

- дети
- illness
- household medicines
- pillbox
- family members
- subscription state

### 1. Справочник и аптечка — разные сущности

`curated_medicine_catalog_items`:
- общий
- версионируемый
- загружается сидером

`household_medicines`:
- пользовательский snapshot
- зависит от семьи
- редактируется через UI

### 2. Напоминания берут данные из аптечки

Flow:
1. Пользователь ищет препарат в `curated_medicine_catalog_items`
2. Выбирает его
3. Создаётся запись в `household_medicines`
4. Напоминания и болезни работают уже с `household_medicines`

Следствие: после добавления упаковки runtime не должен ходить в каталог за "живыми" данными.

### 3. Ручной препарат не меняет каталог

Если пользователь добавляет свой препарат:
- создаётся только запись в `household_medicines`
- `curated_medicine_catalog_items` не меняется

### 4. Дозировка для расчёта живёт в аптечке

Для reminder flow источником являются:
- `pediatric_dose_mg_per_kg_min`
- `pediatric_dose_mg_per_kg_max`
- `pediatric_dose_note`

Они могут прийти:
- из справочника при добавлении в аптечку
- или быть настроены пользователем для конкретной упаковки

### 5. Snapshot важнее каталога

Если запись уже попала в аптечку:
- она должна быть самодостаточной
- напоминание, widget и detail view должны уметь работать без повторного чтения каталога

## Что удалено из legacy

Удалено:
- `medicine_catalog_items`
- `household_medicines.catalog_item_id`
- raw API `/medicine-catalog`
- backend-слой raw-каталога

Это сделано специально, чтобы не было двух конкурирующих каталогов в runtime.

## Текущее состояние продовой БД

Проверено на Railway:
- текущая alembic-версия: `057_clear_medicine_data`
- `curated_medicine_catalog_items` существует и заполнена
- `household_medicines` существует в новой схеме
- `medicine_catalog_items` отсутствует

На момент проверки:
- `curated_medicine_catalog_items`: `676`
- `household_medicines`: `0`
- `episode_medication_plans`: `0`
- `administration_events`: `0`

Это соответствует clean rollout после cleanup-миграции и последующего seed каталога.

## Что нельзя ломать дальше

1. Не возвращать raw-каталог в runtime-логику.
2. Не привязывать аптечку обратно к старому FK.
3. Не смешивать `medicine_form` и `medicine_category`.
4. Не переводить catalog data обратно в alembic data-migrations.
5. Массовые обновления каталога делать через seed-источник, а не руками в продовой БД.
6. Не разрывать family-scoped модель подписки и downgrade-якорей (`free_primary_child_id`, `free_primary_pillbox_plan_id`).
