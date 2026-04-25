"""Helpers for auth responses across web and native clients."""

from fastapi import Response

from src.api.utils.auth_cookies import set_auth_cookies
from src.application.dto.auth import AuthResponseDto


def strip_tokens_from_auth_response(auth: AuthResponseDto) -> AuthResponseDto:
    """Web clients should use HttpOnly cookies and not receive token pair in JSON."""

    return auth.model_copy(update={"access_token": None, "refresh_token": None})


def build_auth_response(
    response: Response,
    auth: AuthResponseDto,
    *,
    include_tokens: bool,
    include_cookies: bool,
) -> AuthResponseDto:
    if include_cookies:
        set_auth_cookies(response, auth)
    if include_tokens:
        return auth
    return strip_tokens_from_auth_response(auth)
