from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.deps import get_public_support_request_service
from src.api.routers import public_support
from src.application.dto.public_support_request import (
    PublicSupportRequestCreateDto,
    PublicSupportRequestResponseDto,
)
from src.application.services.public_support_request_service import (
    PublicSupportRequestService,
)
from src.core.exception_handlers import app_exception_handler
from src.core.exceptions import AppException, RateLimitedError
from src.domain.entities.public_support_request import PublicSupportRequest


class StubPublicSupportRequestRepository:
    def __init__(self, items: list[PublicSupportRequest] | None = None) -> None:
        self.items = items or []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def count_since(self, reply_contact: str, since: datetime) -> int:
        return sum(
            1
            for item in self.items
            if item.reply_contact == reply_contact and item.created_at >= since
        )

    async def get_by_reply_contact_and_client_request_id(
        self,
        reply_contact,
        client_request_id,
    ):  # noqa: ANN001
        return next(
            (
                item
                for item in self.items
                if item.reply_contact == reply_contact
                and item.client_request_id == client_request_id
            ),
            None,
        )

    async def add(self, entity: PublicSupportRequest) -> PublicSupportRequest:
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        before = len(self.items)
        self.items = [item for item in self.items if item.id != id]
        return len(self.items) != before


@pytest.mark.asyncio
async def test_public_support_request_service_trims_and_saves_message() -> None:
    repo = StubPublicSupportRequestRepository()
    service = PublicSupportRequestService(support_repo=repo)

    result = await service.submit(
        PublicSupportRequestCreateDto(
            reply_contact="  mama@example.com  ",
            message="  Нужна помощь с доступом  ",
            client_request_id=uuid4(),
        )
    )

    assert result.reply_contact == "mama@example.com"
    assert result.message == "Нужна помощь с доступом"
    assert len(repo.items) == 1


@pytest.mark.asyncio
async def test_public_support_request_service_is_idempotent_per_contact() -> None:
    request_id = uuid4()
    existing = PublicSupportRequest(
        id=uuid4(),
        reply_contact="mama@example.com",
        message="Existing message",
        client_request_id=request_id,
        created_at=datetime.now(UTC),
    )
    repo = StubPublicSupportRequestRepository(items=[existing])
    service = PublicSupportRequestService(support_repo=repo)

    result = await service.submit(
        PublicSupportRequestCreateDto(
            reply_contact="mama@example.com",
            message="New message should not duplicate",
            client_request_id=request_id,
        )
    )

    assert result.id == existing.id
    assert len(repo.items) == 1


@pytest.mark.asyncio
async def test_public_support_request_service_rate_limits_by_reply_contact() -> None:
    now = datetime.now(UTC)
    repo = StubPublicSupportRequestRepository(
        items=[
            PublicSupportRequest(
                id=uuid4(),
                reply_contact="mama@example.com",
                message=f"Request #{index}",
                client_request_id=uuid4(),
                created_at=now - timedelta(minutes=5),
            )
            for index in range(5)
        ]
    )
    service = PublicSupportRequestService(support_repo=repo)

    with pytest.raises(RateLimitedError) as exc:
        await service.submit(
            PublicSupportRequestCreateDto(
                reply_contact="mama@example.com",
                message="One more request",
                client_request_id=uuid4(),
            )
        )

    assert exc.value.code == "PUBLIC_SUPPORT_RATE_LIMITED"


def test_public_support_router_accepts_unauthenticated_request() -> None:
    class StubPublicSupportRequestService:
        async def submit(
            self,
            dto: PublicSupportRequestCreateDto,
        ) -> PublicSupportRequestResponseDto:
            return PublicSupportRequestResponseDto(
                id=uuid4(),
                reply_contact=dto.reply_contact,
                message=dto.message,
                client_request_id=dto.client_request_id,
                created_at=datetime.now(UTC),
            )

    app = FastAPI()
    app.add_exception_handler(AppException, app_exception_handler)
    app.include_router(public_support.router, prefix="/api/v1")
    app.dependency_overrides[get_public_support_request_service] = (
        lambda: StubPublicSupportRequestService()
    )
    client = TestClient(app)

    response = client.post(
        "/api/v1/public-support",
        json={
            "reply_contact": "mama@example.com",
            "message": "Help with privacy request",
            "client_request_id": str(uuid4()),
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["reply_contact"] == "mama@example.com"
    assert payload["message"] == "Help with privacy request"
