"""Базовые утилиты безопасности: пароли и токены."""

import json
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from base64 import urlsafe_b64decode, urlsafe_b64encode
from uuid import UUID

from src.core.config import settings
from src.core.exceptions import UnauthorizedError


PBKDF2_ITERATIONS = 100_000
SALT_BYTES = 16
JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Хеширует пароль через PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    encoded_salt = urlsafe_b64encode(salt).decode("ascii")
    encoded_digest = urlsafe_b64encode(digest).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${encoded_salt}${encoded_digest}"


def verify_password(password: str, password_hash: str) -> bool:
    """Проверяет пароль против сохранённого хеша."""
    try:
        algorithm, iterations_raw, encoded_salt, encoded_digest = password_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    iterations = int(iterations_raw)
    salt = urlsafe_b64decode(encoded_salt.encode("ascii"))
    expected_digest = urlsafe_b64decode(encoded_digest.encode("ascii"))
    actual_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual_digest, expected_digest)


def generate_session_token() -> str:
    """Генерирует случайный токен для Bearer-сессии."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Хеширует Bearer-токен перед сохранением в БД."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _b64url_encode(data: bytes) -> str:
    return urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return urlsafe_b64decode((value + padding).encode("ascii"))


def _sign(message: bytes) -> str:
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), message, hashlib.sha256).digest()
    return _b64url_encode(signature)


def _encode_jwt(payload: dict[str, str | int]) -> str:
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature_b64 = _sign(signing_input)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def _decode_jwt(token: str, expected_type: str) -> dict[str, str | int]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise UnauthorizedError(code="INVALID_TOKEN") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_signature = _sign(signing_input)
    if not hmac.compare_digest(signature_b64, expected_signature):
        raise UnauthorizedError(code="INVALID_TOKEN")

    header = json.loads(_b64url_decode(header_b64).decode("utf-8"))
    if header.get("alg") != JWT_ALGORITHM:
        raise UnauthorizedError(code="INVALID_TOKEN")

    payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    if payload.get("iss") != settings.jwt_issuer or payload.get("typ") != expected_type:
        raise UnauthorizedError(code="INVALID_TOKEN")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at <= int(datetime.now(timezone.utc).timestamp()):
        raise UnauthorizedError(code="TOKEN_EXPIRED")
    return payload


def create_access_token(account_id: UUID, email: str, family_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        "sub": str(account_id),
        "email": email,
        "family_id": str(family_id),
        "typ": "access",
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _encode_jwt(payload)


def create_refresh_token(
    account_id: UUID,
    family_id: UUID,
    session_id: UUID,
    expires_at: datetime,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(account_id),
        "family_id": str(family_id),
        "sid": str(session_id),
        "typ": "refresh",
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _encode_jwt(payload)


def decode_access_token(token: str) -> dict[str, str | int]:
    return _decode_jwt(token, expected_type="access")


def decode_refresh_token(token: str) -> dict[str, str | int]:
    return _decode_jwt(token, expected_type="refresh")
