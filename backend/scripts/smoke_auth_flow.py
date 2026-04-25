"""Smoke-test auth flow against the configured database."""

from __future__ import annotations

import asyncio
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.application.dto.auth import LoginDto, RegisterDto
from src.application.services.auth_service import AuthService
from src.core.config import settings
from src.infrastructure.database import models  # noqa: F401
from src.infrastructure.database.repositories.account_repository import SqlAccountRepository
from src.infrastructure.database.repositories.account_session_repository import (
    SqlAccountSessionRepository,
)
from src.infrastructure.database.repositories.family_invite_repository import (
    SqlFamilyInviteRepository,
)
from src.infrastructure.database.repositories.family_repository import SqlFamilyRepository


def build_service(session: AsyncSession) -> AuthService:
    return AuthService(
        account_repo=SqlAccountRepository(session),
        session_repo=SqlAccountSessionRepository(session),
        family_repo=SqlFamilyRepository(session),
        family_invite_repo=SqlFamilyInviteRepository(session),
    )


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    email = f"smoke-{uuid4().hex[:12]}@example.com"
    password = "SmokePass123!"

    try:
        async with session_factory() as session:
            service = build_service(session)
            signup = await service.signup(
                RegisterDto(
                    email=email,
                    password=password,
                    remember_me=False,
                    preferred_language="en",
                )
            )
            await session.commit()
            print(f"signup ok: {signup.account.email} family={signup.family.id}")

        async with session_factory() as session:
            service = build_service(session)
            signin = await service.signin(LoginDto(email=email, password=password, remember_me=False))
            current = await service.get_current_account(signin.access_token)
            await session.commit()
            print(f"signin ok: account={signin.account.id} family={signin.family.id}")
            print(f"me ok: email={current.email} role={current.family_role}")
            account_id = signin.account.id

        async with session_factory() as session:
            service = build_service(session)
            await service.delete_family(account_id)
            await session.commit()
            print("cleanup ok: family soft-deleted")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
