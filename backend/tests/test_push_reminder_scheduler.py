from src.application.services.push_reminder_scheduler import (
    _extract_web_push_error_reason,
    _is_stale_web_push_response,
    _resolve_illness_next_allowed_at,
)
from datetime import UTC, datetime, timedelta


class _ResponseWithJson:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


class _ResponseWithText:
    def __init__(self, text: str):
        self.text = text


def test_extract_web_push_error_reason_prefers_json_payload() -> None:
    response = _ResponseWithJson({"reason": "VapidPkHashMismatch"})

    assert _extract_web_push_error_reason(response) == "VapidPkHashMismatch"


def test_extract_web_push_error_reason_parses_text_payload() -> None:
    response = _ResponseWithText('{"reason":"VapidPkHashMismatch"}')

    assert _extract_web_push_error_reason(response) == "VapidPkHashMismatch"


def test_is_stale_web_push_response_accepts_vapid_key_mismatch() -> None:
    assert _is_stale_web_push_response(400, "VapidPkHashMismatch") is True
    assert _is_stale_web_push_response(410, None) is True
    assert _is_stale_web_push_response(400, "OtherReason") is False


def test_resolve_illness_next_allowed_at_uses_plan_created_at_for_first_reminder() -> None:
    created_at = datetime(2026, 5, 1, 9, 30, tzinfo=UTC)
    plan = type("Plan", (), {"created_at": created_at, "min_interval_minutes": 180})()

    next_allowed_at = _resolve_illness_next_allowed_at(plan, None)

    assert next_allowed_at == created_at + timedelta(minutes=180)


def test_resolve_illness_next_allowed_at_prefers_last_administration_when_present() -> None:
    created_at = datetime(2026, 5, 1, 9, 30, tzinfo=UTC)
    last_administration_at = datetime(2026, 5, 1, 10, 10, tzinfo=UTC)
    plan = type("Plan", (), {"created_at": created_at, "min_interval_minutes": 180})()
    administration = type("Administration", (), {"administered_at": last_administration_at})()

    next_allowed_at = _resolve_illness_next_allowed_at(plan, administration)

    assert next_allowed_at == last_administration_at + timedelta(minutes=180)
