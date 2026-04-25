"""Утилиты identity-профиля аккаунта."""

from __future__ import annotations

import re

DEFAULT_ACCOUNT_DISPLAY_NAME = "Участник семьи"

_LOGIN_SAFE_RE = re.compile(r"[^a-z0-9._-]+")


def build_login_from_email(email: str, unique_suffix: str) -> str:
    """Построить внутренний legacy-login по email."""

    local_part = email.strip().lower().split("@", 1)[0]
    base = _LOGIN_SAFE_RE.sub("-", local_part).strip("._-") or "member"
    return f"{base}-{unique_suffix.lower()}"


def normalize_optional_display_name(value: str | None) -> str | None:
    """Нормализовать произвольное имя для профиля."""

    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


def resolve_display_name(value: str | None) -> str:
    """Вернуть имя для UI и журналов с безопасным fallback."""

    return normalize_optional_display_name(value) or DEFAULT_ACCOUNT_DISPLAY_NAME


def needs_profile_completion(value: str | None) -> bool:
    """Нужно ли мягко попросить пользователя заполнить имя."""

    return normalize_optional_display_name(value) is None
