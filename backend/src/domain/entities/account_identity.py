"""Утилиты identity-профиля аккаунта."""

DEFAULT_ACCOUNT_DISPLAY_NAME = "Участник семьи"


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
