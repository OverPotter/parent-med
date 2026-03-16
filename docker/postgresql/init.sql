-- Parent Med: инициализация БД при первом запуске контейнера PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT ALL PRIVILEGES ON DATABASE parent_med TO parent_med_user;

-- Таблицы создаются миграциями Alembic
