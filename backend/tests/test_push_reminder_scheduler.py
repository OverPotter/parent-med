from src.application.services.push_reminder_scheduler import (
    _extract_web_push_error_reason,
    _is_stale_web_push_response,
)


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
