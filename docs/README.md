# Docs Index

Если новый агент или разработчик заходит в проект, ему достаточно двух основных файлов.

## Читать в таком порядке

1. [Project Map](./project-map.md)
- как сейчас называются сервисы и домены
- где backend, frontend и Postgres
- какие env важны
- как запускать `dev` и `prod`
- как каталог лекарств попадает на сервер

2. [Database Architecture](./database-architecture.md)
- как сейчас устроена БД
- какие главные сущности есть
- как связаны каталог, аптечка, напоминания и логи приёма
- что удалено из legacy

## Коротко

Нужно помнить 4 вещи:

1. Runtime работает от `household_medicines`, а не от живого каталога.
2. Старый raw catalog удалён.
3. Catalog data идёт через seed, а не через Alembic data-migrations.
4. Production backend сейчас: `https://parent-med-production.up.railway.app`
