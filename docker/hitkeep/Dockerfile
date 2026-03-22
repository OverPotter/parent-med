# syntax=docker/dockerfile:1
# Обход сбоя старта: `exec: "hitkeep": executable file not found in $PATH` при отсутствии +x на бинарнике
# в базовом слое (зависит от драйвера/хранилища Docker). Перекладываем бинарник с явным режимом 755.
ARG HITKEEP_VERSION=2.1.0
FROM pascalebeier/hitkeep:${HITKEEP_VERSION} AS upstream
FROM pascalebeier/hitkeep:${HITKEEP_VERSION}
COPY --chmod=755 --from=upstream /usr/local/bin/hitkeep /usr/local/bin/hitkeep
