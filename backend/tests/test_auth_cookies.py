from fastapi import Response

from src.api.utils.auth_cookies import clear_auth_cookies, set_auth_cookies
from src.application.dto.auth import AccountResponseDto, AuthResponseDto
from src.application.dto.family import FamilyResponseDto
from src.core.config import settings


def make_auth_response() -> AuthResponseDto:
    return AuthResponseDto(
        access_token="access-token",
        refresh_token="refresh-token",
        account=AccountResponseDto(
            id="00000000-0000-0000-0000-000000000001",
            email=None,
            family_id="00000000-0000-0000-0000-000000000002",
            display_name="Мама",
            family_role="admin",
        ),
        family=FamilyResponseDto(
            id="00000000-0000-0000-0000-000000000002",
            name="Моя семья",
            cabinet_member_account_ids=[],
        ),
    )


def test_set_auth_cookies_writes_both_tokens() -> None:
    response = Response()

    set_auth_cookies(response, make_auth_response())

    headers = response.headers.getlist("set-cookie")
    assert any(settings.access_cookie_name in header for header in headers)
    assert any(settings.refresh_cookie_name in header for header in headers)


def test_set_auth_cookies_uses_long_refresh_for_remember_me() -> None:
    response = Response()
    auth = make_auth_response()
    auth.remember_me = True

    set_auth_cookies(response, auth)

    headers = response.headers.getlist("set-cookie")
    refresh_header = next(
        header for header in headers if header.startswith(f"{settings.refresh_cookie_name}=")
    )
    assert f"Max-Age={settings.refresh_token_ttl_days_remember_me * 24 * 60 * 60}" in refresh_header


def test_clear_auth_cookies_deletes_both_tokens() -> None:
    response = Response()

    clear_auth_cookies(response)

    headers = response.headers.getlist("set-cookie")
    assert any(f"{settings.access_cookie_name}=" in header for header in headers)
    assert any(f"{settings.refresh_cookie_name}=" in header for header in headers)
