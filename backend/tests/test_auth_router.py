from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.deps import (
    get_auth_attempt_repo,
    get_auth_service,
    get_current_account,
    get_family_invite_service,
)
from src.api.routers import auth, family_invites
from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    LoginDto,
    RefreshDto,
    RegisterDto,
)
from src.application.dto.family import FamilyResponseDto
from src.application.dto.family_invite import (
    FamilyInviteCreateDto,
    FamilyInviteHandoffCreateResponseDto,
    FamilyInviteHandoffResolveResponseDto,
    FamilyInvitePreviewResponseDto,
    FamilyInviteResponseDto,
)
from src.core.exception_handlers import app_exception_handler
from src.core.exceptions import AppException, UnauthorizedError
from src.domain.entities.auth_attempt import AuthAttempt


def _make_auth_response() -> AuthResponseDto:
    family_id = uuid4()
    return AuthResponseDto(
        access_token="access-token",
        refresh_token="refresh-token",
        account=AccountResponseDto(
            id=uuid4(),
            email="mama@example.com",
            family_id=family_id,
            display_name="Мама",
            family_role="owner",
        ),
        family=FamilyResponseDto(id=family_id, name="Моя семья", cabinet_member_account_ids=[]),
    )


class StubAuthService:
    def __init__(self, *, fail_signin: bool = False) -> None:
        self.fail_signin = fail_signin
        self.logout_calls: list[tuple[object, object]] = []
        self.delete_me_calls: list[object] = []
        self.delete_family_calls: list[object] = []

    async def signup(self, dto: RegisterDto) -> AuthResponseDto:
        return _make_auth_response()

    async def signin(self, dto: LoginDto) -> AuthResponseDto:
        if self.fail_signin:
            raise UnauthorizedError("Неверный email или пароль", code="INVALID_CREDENTIALS")
        return _make_auth_response()

    async def refresh(self, dto: RefreshDto) -> AuthResponseDto:
        return _make_auth_response()

    async def get_current_account(self, token: str) -> AuthenticatedAccount:
        raise NotImplementedError

    async def get_me(self, account_id, family_id) -> AuthStateResponseDto:  # noqa: ANN001
        raise NotImplementedError

    async def logout(self, account_id, refresh_token=None) -> None:  # noqa: ANN001
        self.logout_calls.append((account_id, refresh_token))

    async def delete_me(self, account_id) -> None:  # noqa: ANN001
        self.delete_me_calls.append(account_id)

    async def delete_family(self, account_id) -> None:  # noqa: ANN001
        self.delete_family_calls.append(account_id)

    async def change_password(self, account_id, dto) -> None:  # noqa: ANN001
        raise NotImplementedError

    async def update_recovery_code(self, account_id, dto) -> None:  # noqa: ANN001
        raise NotImplementedError

    async def reset_password_by_recovery_code(self, dto) -> None:  # noqa: ANN001
        raise NotImplementedError

    async def update_language(self, account_id, dto):  # noqa: ANN001
        raise NotImplementedError

    async def update_profile(self, account_id, dto):  # noqa: ANN001
        raise NotImplementedError

    async def accept_family_invite(self, account_id, token) -> AuthResponseDto:  # noqa: ANN001
        return _make_auth_response()

    async def accept_family_invite_handoff(self, account_id, handoff_id) -> AuthResponseDto:  # noqa: ANN001
        return _make_auth_response()


class StubFamilyInviteService:
    def __init__(self) -> None:
        self.create_calls = 0

    async def create_for_account(self, family_id, current_account_id, dto):  # noqa: ANN001
        self.create_calls += 1
        token = f"invite-token-{self.create_calls}"
        return FamilyInviteResponseDto(
            token=token,
            family_id=family_id,
            family_name="Моя семья",
            family_role=dto.family_role,
            invite_path=f"/join-family?token={token}",
            expires_at=datetime(2030, 1, 1),
        )

    async def get_latest_preview_for_dev(self) -> FamilyInvitePreviewResponseDto:
        return FamilyInvitePreviewResponseDto(
            family_id=uuid4(),
            family_name="Моя семья",
            family_role="member",
            expires_at=datetime(2030, 1, 1),
        )

    async def get_preview(self, token: str) -> FamilyInvitePreviewResponseDto:
        return FamilyInvitePreviewResponseDto(
            family_id=uuid4(),
            family_name=f"Invite {token}",
            family_role="member",
            expires_at=datetime(2030, 1, 1),
        )

    async def create_handoff(self, token: str) -> FamilyInviteHandoffCreateResponseDto:
        return FamilyInviteHandoffCreateResponseDto(
            handoff_id=f"handoff-{token}",
            handoff_path=f"/join-family-handoff?hid=handoff-{token}",
            family_id=uuid4(),
            family_name="Моя семья",
            family_role="member",
            expires_at=datetime(2030, 1, 1),
            invite_expires_at=datetime(2030, 1, 2),
        )

    async def resolve_handoff(self, handoff_id: str) -> FamilyInviteHandoffResolveResponseDto:
        return FamilyInviteHandoffResolveResponseDto(
            handoff_id=handoff_id,
            family_id=uuid4(),
            family_name="Моя семья",
            family_role="member",
            expires_at=datetime(2030, 1, 1),
            invite_expires_at=datetime(2030, 1, 2),
        )


@dataclass
class StubAuthAttemptRepository:
    attempts: list[AuthAttempt]

    def __init__(self) -> None:
        self.attempts = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.attempts if item.id == id), None)

    async def add(self, entity: AuthAttempt) -> AuthAttempt:
        self.attempts.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        before = len(self.attempts)
        self.attempts = [item for item in self.attempts if item.id != id]
        return len(self.attempts) != before

    def locked(self, keys: list[str]) -> AbstractAsyncContextManager[StubAuthAttemptRepository]:
        return _RepositoryContext(self)

    async def count_since(self, action: str, bucket_key: str, threshold: datetime) -> int:
        return sum(
            1
            for item in self.attempts
            if item.action == action
            and item.bucket_key == bucket_key
            and item.created_at > threshold
        )

    async def delete_older_than(self, threshold: datetime) -> int:
        before = len(self.attempts)
        self.attempts = [item for item in self.attempts if item.created_at > threshold]
        return before - len(self.attempts)


class _RepositoryContext(AbstractAsyncContextManager):
    def __init__(self, repo: StubAuthAttemptRepository) -> None:
        self._repo = repo

    async def __aenter__(self) -> StubAuthAttemptRepository:
        return self._repo

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None


def _build_test_app(
    *,
    auth_service: StubAuthService,
    attempts_repo: StubAuthAttemptRepository,
    family_invite_service: StubFamilyInviteService | None = None,
) -> TestClient:
    app = FastAPI()
    app.add_exception_handler(AppException, app_exception_handler)
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(family_invites.router, prefix="/api/v1")
    app.dependency_overrides[get_auth_service] = lambda: auth_service
    app.dependency_overrides[get_auth_attempt_repo] = lambda: attempts_repo
    app.dependency_overrides[get_family_invite_service] = (
        lambda: family_invite_service or StubFamilyInviteService()
    )
    app.dependency_overrides[get_current_account] = lambda: AuthenticatedAccount(
        id=uuid4(),
        email="mama@example.com",
        family_id=uuid4(),
        display_name="Мама",
        family_role="owner",
    )
    return TestClient(app)


def test_web_signin_omits_tokens_from_json() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post(
        "/api/v1/auth/signin",
        json={"email": "mama@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] is None
    assert payload["refresh_token"] is None
    assert "set-cookie" in response.headers


def test_native_signin_returns_tokens_in_json() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post(
        "/api/v1/auth/native/signin",
        json={"email": "mama@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] == "access-token"
    assert payload["refresh_token"] == "refresh-token"
    assert "set-cookie" not in response.headers


def test_signin_rate_limit_trips_after_repeated_failures() -> None:
    attempts_repo = StubAuthAttemptRepository()
    client = _build_test_app(
        auth_service=StubAuthService(fail_signin=True), attempts_repo=attempts_repo
    )

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/signin",
            json={"email": "mama@example.com", "password": "wrong-pass"},
        )
        assert response.status_code == 401

    limited = client.post(
        "/api/v1/auth/signin",
        json={"email": "mama@example.com", "password": "wrong-pass"},
    )

    assert limited.status_code == 429
    assert limited.json()["code"] == "SIGNIN_IDENTITY_RATE_LIMITED"


def test_web_family_invite_accept_omits_tokens() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post(f"/api/v1/family-invites/{uuid4()}/accept")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] is None
    assert payload["refresh_token"] is None
    assert "set-cookie" in response.headers


def test_create_family_invite_returns_fresh_token_on_each_request() -> None:
    invite_service = StubFamilyInviteService()
    client = _build_test_app(
        auth_service=StubAuthService(),
        attempts_repo=StubAuthAttemptRepository(),
        family_invite_service=invite_service,
    )

    first = client.post("/api/v1/family-invites", json={"family_role": "member"})
    second = client.post("/api/v1/family-invites", json={"family_role": "member"})

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["token"] != second.json()["token"]
    assert first.json()["invite_path"] != second.json()["invite_path"]
    assert invite_service.create_calls == 2


def test_create_family_invite_handoff_returns_app_route() -> None:
    invite_service = StubFamilyInviteService()
    client = _build_test_app(
        auth_service=StubAuthService(),
        attempts_repo=StubAuthAttemptRepository(),
        family_invite_service=invite_service,
    )

    response = client.post("/api/v1/family-invites/invite-token-123/handoff")

    assert response.status_code == 201
    payload = response.json()
    assert payload["handoff_id"] == "handoff-invite-token-123"
    assert payload["handoff_path"] == "/join-family-handoff?hid=handoff-invite-token-123"


def test_resolve_family_invite_handoff_returns_invite_token() -> None:
    invite_service = StubFamilyInviteService()
    client = _build_test_app(
        auth_service=StubAuthService(),
        attempts_repo=StubAuthAttemptRepository(),
        family_invite_service=invite_service,
    )

    response = client.get("/api/v1/family-invites/handoff/handoff-123")

    assert response.status_code == 200
    payload = response.json()
    assert payload["handoff_id"] == "handoff-123"
    assert payload["family_role"] == "member"


def test_accept_family_invite_handoff_omits_tokens() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post("/api/v1/family-invites/handoff/handoff-123/accept")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] is None
    assert payload["refresh_token"] is None
    assert "set-cookie" in response.headers


def test_accept_family_invite_handoff_native_returns_tokens() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post("/api/v1/family-invites/handoff/handoff-123/accept/native")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] == "access-token"
    assert payload["refresh_token"] == "refresh-token"
    assert "set-cookie" not in response.headers


def test_delete_me_calls_account_deletion() -> None:
    service = StubAuthService()
    client = _build_test_app(auth_service=service, attempts_repo=StubAuthAttemptRepository())

    response = client.delete("/api/v1/auth/me")

    assert response.status_code == 204
    assert len(service.delete_me_calls) == 1
    assert len(service.delete_family_calls) == 0


def test_delete_family_calls_family_deletion() -> None:
    service = StubAuthService()
    client = _build_test_app(auth_service=service, attempts_repo=StubAuthAttemptRepository())

    response = client.delete("/api/v1/auth/family")

    assert response.status_code == 204
    assert len(service.delete_family_calls) == 1
    assert len(service.delete_me_calls) == 0


def test_native_family_invite_accept_returns_tokens() -> None:
    client = _build_test_app(
        auth_service=StubAuthService(), attempts_repo=StubAuthAttemptRepository()
    )

    response = client.post(f"/api/v1/family-invites/{uuid4()}/accept/native")

    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"] == "access-token"
    assert payload["refresh_token"] == "refresh-token"
    assert "set-cookie" not in response.headers


def test_native_logout_passes_refresh_token_from_body() -> None:
    service = StubAuthService()
    client = _build_test_app(auth_service=service, attempts_repo=StubAuthAttemptRepository())

    response = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": "native-refresh-token"},
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 204
    assert len(service.logout_calls) == 1
    assert service.logout_calls[0][1] == "native-refresh-token"
