"""Роуты: дети."""

from datetime import date
from typing import Literal
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, Response

from src.api.deps import (
    get_child_export_service,
    get_child_overview_service,
    get_child_service,
    get_child_summary_service,
    get_current_account,
)
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child import (
    ChildCreateDto,
    ChildResponseDto,
    ChildSummaryResponseDto,
    ChildUpdateDto,
)
from src.application.dto.child_overview import ChildOverviewResponseDto
from src.application.services.child_export_service import ChildExportService
from src.application.services.child_overview_service import ChildOverviewService
from src.application.services.child_service import ChildService
from src.application.services.child_summary_service import ChildSummaryService

router = APIRouter(prefix="/children", tags=["children"])


def _build_content_disposition(filename: str) -> str:
    ascii_fallback = "".join(char if ord(char) < 128 else "_" for char in filename)
    ascii_fallback = ascii_fallback or "export"
    quoted_filename = quote(filename)
    return f'attachment; filename="{ascii_fallback}"; ' f"filename*=UTF-8''{quoted_filename}"


@router.get("/management", response_model=list[ChildResponseDto])
async def list_children_for_management(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> list[ChildResponseDto]:
    """Полный список детей в семье для admin-настроек."""
    return await service.get_by_family_id_for_management(family_id, account)


@router.get("/summary", response_model=list[ChildSummaryResponseDto])
async def list_children_summary(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildSummaryService = Depends(get_child_summary_service),
) -> list[ChildSummaryResponseDto]:
    """Сводка по детям для children-карточек."""
    return await service.list_for_family_for_account(family_id, account)


@router.get("/{child_id}", response_model=ChildResponseDto)
async def get_child(
    child_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Получить ребёнка по id."""
    return await service.get_by_id_for_account(child_id, account)


@router.get("/{child_id}/overview", response_model=ChildOverviewResponseDto)
async def get_child_overview(
    child_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildOverviewService = Depends(get_child_overview_service),
) -> ChildOverviewResponseDto:
    """Агрегированный overview payload для mobile."""
    return await service.get_for_child(child_id, account)


@router.get("/{child_id}/exports/archive")
async def export_child_archive(
    child_id: UUID,
    format: Literal["zip", "xlsx"] = "zip",
    period: Literal["all", "month", "custom"] = "month",
    start_date: date | None = None,
    end_date: date | None = None,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildExportService = Depends(get_child_export_service),
) -> Response:
    """Export all child files as a zip archive or workbook."""
    if format == "xlsx":
        workbook = await service.export_workbook_for_account(
            child_id=child_id,
            period=period,
            current_account=account,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(
            content=workbook.content,
            media_type=("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            headers={"Content-Disposition": _build_content_disposition(workbook.filename)},
        )

    archive = await service.export_archive_for_account(
        child_id=child_id,
        period=period,
        current_account=account,
        start_date=start_date,
        end_date=end_date,
    )
    return Response(
        content=archive.content,
        media_type="application/zip",
        headers={"Content-Disposition": _build_content_disposition(archive.filename)},
    )


@router.get("/{child_id}/exports/{export_kind}")
async def export_child_csv(
    child_id: UUID,
    export_kind: Literal["analytics_summary", "child_care", "child_illness"],
    format: Literal["csv", "xlsx"] = "csv",
    period: Literal["all", "month", "custom"] = "month",
    start_date: date | None = None,
    end_date: date | None = None,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildExportService = Depends(get_child_export_service),
) -> Response:
    """Export child-scoped CSV/XLSX data for premium families."""
    if format == "xlsx":
        export_file = await service.export_xlsx_for_account(
            child_id=child_id,
            export_kind=export_kind,
            period=period,
            current_account=account,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(
            content=export_file.content,
            media_type=("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            headers={"Content-Disposition": _build_content_disposition(export_file.filename)},
        )

    export_file = await service.export_csv_for_account(
        child_id=child_id,
        export_kind=export_kind,
        period=period,
        current_account=account,
        start_date=start_date,
        end_date=end_date,
    )
    return Response(
        content=export_file.content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": _build_content_disposition(export_file.filename)},
    )


@router.get("", response_model=list[ChildResponseDto])
async def list_children(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> list[ChildResponseDto]:
    """Список детей в семье."""
    return await service.get_by_family_id_for_account(family_id, account)


@router.post("", response_model=ChildResponseDto, status_code=201)
async def create_child(
    dto: ChildCreateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Добавить ребёнка."""
    return await service.create_for_account(dto, account)


@router.patch("/{child_id}", response_model=ChildResponseDto)
async def update_child(
    child_id: UUID,
    dto: ChildUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> ChildResponseDto:
    """Обновить ребёнка."""
    return await service.update_for_account(child_id, dto, account)


@router.delete("/{child_id}", status_code=204)
async def delete_child(
    child_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: ChildService = Depends(get_child_service),
) -> None:
    """Удалить ребёнка."""
    await service.delete_for_account(child_id, account)
