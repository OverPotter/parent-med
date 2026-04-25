# Curated Medicine Catalog Seeding

Этот файл описывает, как теперь добавлять и обновлять записи справочника лекарств на сервере.

## Главное правило

Каталог лекарств больше не живёт в миграциях.

Разделение сейчас такое:
- схема БД меняется через Alembic
- данные каталога загружаются сидером

То есть:
- `migration` = таблицы, колонки, индексы, cleanup legacy
- `seed` = записи в `curated_medicine_catalog_items`

Именно так надо думать о rollout:
- код + миграции переводят архитектуру
- seed наполняет справочник

## Где лежит источник данных

Текущий каталог собирается из seed-источников в `backend/data/`.

Используются файлы:
- `backend/data/curated_medicine_catalog_seed.json`
- `backend/data/curated_medicine_catalog_seed_part2.json`
- `backend/data/curated_medicine_catalog_seed_part3.py`
- `backend/data/curated_medicine_catalog_seed_part4.py`
- `backend/data/curated_medicine_catalog_seed_part5.py`

Скрипт загрузки:
- `backend/scripts/seed_curated_medicine_catalog.py`

## Что делает сидер

Сидер:
- читает все seed-файлы
- объединяет payload
- валидирует, что он не пустой
- проверяет дубли
- обновляет записи в `curated_medicine_catalog_items`

Он нужен для:
- первоначального наполнения каталога
- повторного заполнения после cleanup rollout
- последующих обновлений справочника

## Как запускать локально

Из `backend/`:

```bash
uv run python scripts/seed_curated_medicine_catalog.py
```

Минимальная проверка после запуска:

```sql
select language, count(*)
from curated_medicine_catalog_items
group by language
order by language;
```

И отдельно:

```sql
select is_home_cabinet_relevant, count(*)
from curated_medicine_catalog_items
group by is_home_cabinet_relevant;
```

## Как это работает на сервере

На backend добавлен флаг:

```env
RUN_CURATED_CATALOG_SEED=1
```

Если флаг включён, при старте backend после миграций выполняется:

```bash
uv run python scripts/seed_curated_medicine_catalog.py
```

Поддержка этого уже встроена в:
- `backend/docker/entrypoint.sh`
- `backend/railway.toml`
- `docker-compose.yml`
- `backend/.env.example`

## Когда включать `RUN_CURATED_CATALOG_SEED`

Включать только когда:
- seed-скрипт уже в репозитории
- `backend/data/*` уже попадает в Docker image
- нужно реально наполнить или обновить каталог

Не включать, если:
- вы хотите только применить миграции схемы
- вы не готовы перезаполнять каталог

## Важный нюанс про Docker

Чтобы seed работал в Railway/Docker image:
- `backend/data/*` должно попадать в образ

Для этого уже исправлено:
- `backend/.dockerignore`

Если `backend/data/*` не попадает в image, сидер падает с ошибкой:

```text
Curated medicine catalog seed is empty
```

Это уже было реальной проблемой на проде, поэтому правило важное: данные seed должны ехать в том же deploy artifact, что и скрипт.

## Как правильно добавлять новые препараты

Правильный путь:

1. Обновить seed-файлы в `backend/data/`
2. При необходимости обновить код сборки payload
3. Локально прогнать сидер
4. Проверить содержимое БД выборками
5. Закоммитить seed-изменения
6. Задеплоить backend
7. Выполнить seed на сервере

Если нужно полностью воспроизводимое обновление, seed должен оставаться единственным источником правды для каталога.

## Что не надо делать

Не рекомендуется:
- массово вставлять каталог вручную через DataGrip
- хранить каталог в Alembic data-migration
- обновлять продовый каталог руками без источника в git

Почему:
- это не воспроизводимо
- сложно повторить rollout
- легко потерять источник правды

Ручные правки в БД допустимы только как emergency-fix для 1-2 записей.

## Серверный rollout

### Вариант 1. Автосид при деплое

1. Убедиться, что в Railway backend env стоит:

```env
RUN_CURATED_CATALOG_SEED=1
```

2. Задеплоить backend
3. Дождаться применения миграций
4. Проверить startup logs сидера
5. Проверить БД:

```sql
select count(*) from curated_medicine_catalog_items;
```

### Вариант 2. Ручной запуск после деплоя

1. Задеплоить backend
2. Зайти в shell сервиса
3. Выполнить:

```bash
uv run python scripts/seed_curated_medicine_catalog.py
```

4. Проверить БД

## Что сейчас на проде

Проверено:
- таблица `curated_medicine_catalog_items` существует
- каталог заполнен
- текущий объём: `676` записей
- `ru`: `338`
- `en`: `338`

Это значит, что прод сейчас уже работает по новой схеме:
- архитектура через миграции
- данные каталога через seed
