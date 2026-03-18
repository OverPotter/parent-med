from fastapi import Response

from src.api.auth_cookies import clear_auth_cookies, set_auth_cookies
from src.application.dto.auth import AccountResponseDto, AuthResponseDto
from src.application.dto.family import FamilyResponseDto
from src.core.config import settings


def make_auth_response() -> AuthResponseDto:
    return AuthResponseDto(
        access_token="access-token",
        refresh_token="refresh-token",
        account=AccountResponseDto(
            id="00000000-0000-0000-0000-000000000001",
            email="test@example.com",
            family_id="00000000-0000-0000-0000-000000000002",
        ),
        family=FamilyResponseDto(
            id="00000000-0000-0000-0000-000000000002",
            name="Моя семья",
        ),
    )


def test_set_auth_cookies_writes_both_tokens() -> None:
    response = Response()

    set_auth_cookies(response, make_auth_response())

    headers = response.headers.getlist("set-cookie")
    assert any(settings.access_cookie_name in header for header in headers)
    assert any(settings.refresh_cookie_name in header for header in headers)


def test_clear_auth_cookies_deletes_both_tokens() -> None:
    response = Response()

    clear_auth_cookies(response)

    headers = response.headers.getlist("set-cookie")
    assert any(f"{settings.access_cookie_name}=" in header for header in headers)
    assert any(f"{settings.refresh_cookie_name}=" in header for header in headers)
