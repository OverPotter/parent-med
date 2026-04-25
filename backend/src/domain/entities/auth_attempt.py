"""Auth attempt entity used for throttling sensitive endpoints."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AuthAttempt:
    id: UUID
    action: str
    bucket_key: str
    created_at: datetime
