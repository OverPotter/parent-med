-- PillPath: инициализация БД при первом запуске контейнера PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT ALL PRIVILEGES ON DATABASE pillpath TO pillpath_user;

-- Таблицы создаются миграциями Alembic
