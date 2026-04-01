"""Минимальный тест: проверка импорта приложения и конфига."""


def test_import_app():
    """Приложение и конфиг импортируются без ошибок."""
    from src.core.config import settings

    assert settings.app_name == "PillPath API"
