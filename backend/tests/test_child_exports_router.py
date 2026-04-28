from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.deps import get_child_export_service, get_current_account
from src.api.routers import children
from src.application.dto.auth import AuthenticatedAccount
from src.core.exception_handlers import app_exception_handler
from src.core.exceptions import AppException, ValidationError


class StubChildExportService:
    def __init__(self, *, should_fail: bool = False) -> None:
        self.should_fail = should_fail

    async def export_csv_for_account(self, **kwargs):  # noqa: ANN003
        if self.should_fail:
            raise ValidationError(
                "Экспорт данных доступен только в Plus.",
                code="PLUS_REQUIRED_FOR_CSV_EXPORT",
                status_code=403,
            )

        class ExportFile:
            filename = "Мия_analytics_summary.csv"
            content = "Показатель,Значение\r\n"

        return ExportFile()

    async def export_archive_for_account(self, **kwargs):  # noqa: ANN003
        class ExportArchive:
            filename = "Мия_exports.zip"
            content = b"zip-content"

        return ExportArchive()

    async def export_xlsx_for_account(self, **kwargs):  # noqa: ANN003
        class ExportFile:
            filename = "Мия_analytics_summary.xlsx"
            content = b"xlsx-content"

        return ExportFile()

    async def export_workbook_for_account(self, **kwargs):  # noqa: ANN003
        class ExportWorkbook:
            filename = "Мия_exports.xlsx"
            content = b"xlsx-workbook-content"

        return ExportWorkbook()


def _build_client(service: StubChildExportService) -> TestClient:
    app = FastAPI()
    app.add_exception_handler(AppException, app_exception_handler)
    app.include_router(children.router, prefix="/api/v1")
    app.dependency_overrides[get_child_export_service] = lambda: service
    app.dependency_overrides[get_current_account] = lambda: AuthenticatedAccount(
        id=uuid4(),
        email="mama@example.com",
        family_id=uuid4(),
        display_name="Мама",
        family_role="owner",
    )
    return TestClient(app)


def test_child_export_csv_route_sets_attachment_headers() -> None:
    client = _build_client(StubChildExportService())

    response = client.get(f"/api/v1/children/{uuid4()}/exports/analytics_summary")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment;" in response.headers["content-disposition"]
    assert "filename*=UTF-8''" in response.headers["content-disposition"]


def test_child_export_archive_route_returns_zip() -> None:
    client = _build_client(StubChildExportService())

    response = client.get(f"/api/v1/children/{uuid4()}/exports/archive")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert 'filename="____exports.zip"' in response.headers["content-disposition"]
    assert "%D0%9C%D0%B8%D1%8F_exports.zip" in response.headers["content-disposition"]


def test_child_export_xlsx_route_returns_workbook() -> None:
    client = _build_client(StubChildExportService())

    response = client.get(f"/api/v1/children/{uuid4()}/exports/analytics_summary?format=xlsx")

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "%D0%9C%D0%B8%D1%8F_analytics_summary.xlsx" in response.headers["content-disposition"]


def test_child_export_archive_route_returns_xlsx_workbook() -> None:
    client = _build_client(StubChildExportService())

    response = client.get(f"/api/v1/children/{uuid4()}/exports/archive?format=xlsx")

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert "%D0%9C%D0%B8%D1%8F_exports.xlsx" in response.headers["content-disposition"]


def test_child_export_csv_route_returns_403_for_free_plan() -> None:
    client = _build_client(StubChildExportService(should_fail=True))

    response = client.get(f"/api/v1/children/{uuid4()}/exports/analytics_summary")

    assert response.status_code == 403
    assert response.json()["code"] == "PLUS_REQUIRED_FOR_CSV_EXPORT"
