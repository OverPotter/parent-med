"""Доменные и прикладные исключения с кодом и status_code."""


class AppException(Exception):
    """Базовое исключение приложения с кодом и HTTP-статусом."""

    def __init__(self, message: str, code: str = "ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppException):
    """Сущность не найдена."""

    def __init__(self, message: str = "Не найдено", resource: str | None = None):
        code = f"{resource}_NOT_FOUND" if resource else "NOT_FOUND"
        super().__init__(message=message, code=code, status_code=404)


class ValidationError(AppException):
    """Ошибка валидации (доменная или бизнес-правило)."""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR", status_code: int = 422):
        super().__init__(message=message, code=code, status_code=status_code)


class UnauthorizedError(AppException):
    """Пользователь не аутентифицирован."""

    def __init__(self, message: str = "Требуется авторизация", code: str = "UNAUTHORIZED"):
        super().__init__(message=message, code=code, status_code=401)


class ForbiddenError(AppException):
    """У пользователя нет доступа к ресурсу."""

    def __init__(self, message: str = "Недостаточно прав", code: str = "FORBIDDEN"):
        super().__init__(message=message, code=code, status_code=403)


class SafetyBlockedError(AppException):
    """Safety Engine заблокировал действие (небезопасно)."""

    def __init__(self, message: str, code: str = "SAFETY_BLOCKED", status_code: int = 422):
        super().__init__(message=message, code=code, status_code=status_code)
