"""Child export orchestration and access checks."""

from __future__ import annotations

import io
import zipfile
from csv import reader as csv_reader
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal, TypeVar
from uuid import UUID
from xml.sax.saxutils import escape

from src.application.dto.auth import AuthenticatedAccount
from src.application.services.access_control import get_child_for_account
from src.application.services.child_export_renderer import (
    AppLanguage,
    ChildExportPayload,
    ChildExportRenderer,
    EpisodeExportBundle,
    ExportKind,
)
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.domain.repositories.height_entry_repository import HeightEntryRepository
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository

ExportPeriod = Literal["all", "month", "custom"]
PayloadSection = Literal["sleeps", "feedings", "weights", "heights", "illness"]
T = TypeVar("T")


@dataclass(slots=True)
class ChildExportFile:
    filename: str
    content: str


@dataclass(slots=True)
class ChildExportArchive:
    filename: str
    content: bytes


@dataclass(slots=True)
class ChildExportBinaryFile:
    filename: str
    content: bytes


class ChildExportService:
    """Generate premium child export files."""

    def __init__(
        self,
        child_repo: ChildRepository,
        family_repo: FamilyRepository,
        sleep_repo: SleepSessionRepository,
        feeding_repo: FeedingRecordRepository,
        weight_repo: WeightEntryRepository,
        height_repo: HeightEntryRepository,
        episode_repo: IllnessEpisodeRepository,
        temperature_repo: TemperatureEntryRepository,
        administration_repo: AdministrationEventRepository,
        comment_repo: IllnessCommentRepository,
        renderer: ChildExportRenderer | None = None,
    ) -> None:
        self._child_repo = child_repo
        self._family_repo = family_repo
        self._sleep_repo = sleep_repo
        self._feeding_repo = feeding_repo
        self._weight_repo = weight_repo
        self._height_repo = height_repo
        self._episode_repo = episode_repo
        self._temperature_repo = temperature_repo
        self._administration_repo = administration_repo
        self._comment_repo = comment_repo
        self._renderer = renderer or ChildExportRenderer()

    async def export_csv_for_account(
        self,
        child_id: UUID,
        export_kind: ExportKind,
        period: ExportPeriod,
        current_account: AuthenticatedAccount,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> ChildExportFile:
        payload = await self._build_payload_for_account(
            child_id=child_id,
            period=period,
            current_account=current_account,
            start_date=start_date,
            end_date=end_date,
            required_sections=self._required_sections_for_export(export_kind),
        )
        filename = f"{self._sanitize_filename_part(payload.child.name)}_{export_kind}.csv"
        content = self._renderer.render_csv(export_kind, payload)
        return ChildExportFile(filename=filename, content=content)

    async def export_archive_for_account(
        self,
        child_id: UUID,
        period: ExportPeriod,
        current_account: AuthenticatedAccount,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> ChildExportArchive:
        payload = await self._build_payload_for_account(
            child_id=child_id,
            period=period,
            current_account=current_account,
            start_date=start_date,
            end_date=end_date,
            required_sections=self._all_payload_sections(),
        )
        archive_name = f"{self._sanitize_filename_part(payload.child.name)}_exports.zip"
        csv_files = [
            (
                f"{self._sanitize_filename_part(payload.child.name)}_{export_kind}.csv",
                self._renderer.render_csv(export_kind, payload),
            )
            for export_kind in ("analytics_summary", "child_care", "child_illness")
        ]
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
            for filename, content in csv_files:
                archive.writestr(filename, content.encode("utf-8-sig"))
        return ChildExportArchive(filename=archive_name, content=buffer.getvalue())

    async def export_xlsx_for_account(
        self,
        child_id: UUID,
        export_kind: ExportKind,
        period: ExportPeriod,
        current_account: AuthenticatedAccount,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> ChildExportBinaryFile:
        payload = await self._build_payload_for_account(
            child_id=child_id,
            period=period,
            current_account=current_account,
            start_date=start_date,
            end_date=end_date,
            required_sections=self._required_sections_for_export(export_kind),
        )
        sheet_rows = self._parse_csv_rows(self._renderer.render_csv(export_kind, payload))
        workbook_bytes = self._build_xlsx_bytes([(self._sheet_title(export_kind), sheet_rows)])
        filename = f"{self._sanitize_filename_part(payload.child.name)}_{export_kind}.xlsx"
        return ChildExportBinaryFile(filename=filename, content=workbook_bytes)

    async def export_workbook_for_account(
        self,
        child_id: UUID,
        period: ExportPeriod,
        current_account: AuthenticatedAccount,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> ChildExportBinaryFile:
        payload = await self._build_payload_for_account(
            child_id=child_id,
            period=period,
            current_account=current_account,
            start_date=start_date,
            end_date=end_date,
            required_sections=self._all_payload_sections(),
        )
        export_kinds: tuple[ExportKind, ...] = (
            "analytics_summary",
            "child_care",
            "child_illness",
        )
        sheets: list[tuple[str, list[list[str]]]] = []
        for export_kind in export_kinds:
            sheets.append(
                (
                    self._sheet_title(export_kind),
                    self._parse_csv_rows(self._renderer.render_csv(export_kind, payload)),
                )
            )
        filename = f"{self._sanitize_filename_part(payload.child.name)}_exports.xlsx"
        return ChildExportBinaryFile(filename=filename, content=self._build_xlsx_bytes(sheets))

    async def _build_payload_for_account(
        self,
        *,
        child_id: UUID,
        period: ExportPeriod,
        current_account: AuthenticatedAccount,
        start_date: date | None,
        end_date: date | None,
        required_sections: set[PayloadSection],
    ) -> ChildExportPayload:
        child = await self._require_export_access(child_id, current_account)
        range_start, range_end = self._resolve_period(
            period=period,
            start_date=start_date,
            end_date=end_date,
        )
        language = self._resolve_language(current_account.preferred_language)

        sleeps = await self._load_filtered_child_items(
            child_id=child.id,
            range_start=range_start,
            range_end=range_end,
            section="sleeps",
            required_sections=required_sections,
        )
        feedings = await self._load_filtered_child_items(
            child_id=child.id,
            range_start=range_start,
            range_end=range_end,
            section="feedings",
            required_sections=required_sections,
        )
        weights = await self._load_filtered_child_items(
            child_id=child.id,
            range_start=range_start,
            range_end=range_end,
            section="weights",
            required_sections=required_sections,
        )
        heights = await self._load_filtered_child_items(
            child_id=child.id,
            range_start=range_start,
            range_end=range_end,
            section="heights",
            required_sections=required_sections,
        )
        episode_bundles = (
            await self._load_episode_bundles(child.id, range_start, range_end)
            if "illness" in required_sections
            else []
        )

        return ChildExportPayload(
            child=child,
            language=language,
            range_start=range_start,
            range_end=range_end,
            sleeps=sleeps,
            feedings=feedings,
            weights=weights,
            heights=heights,
            episode_bundles=episode_bundles,
        )

    def _required_sections_for_export(self, export_kind: ExportKind) -> set[PayloadSection]:
        if export_kind == "analytics_summary":
            return {"sleeps", "feedings", "weights", "heights", "illness"}
        if export_kind == "child_care":
            return {"sleeps", "feedings", "weights", "heights"}
        return {"illness"}

    def _all_payload_sections(self) -> set[PayloadSection]:
        return {"sleeps", "feedings", "weights", "heights", "illness"}

    async def _load_filtered_child_items(
        self,
        *,
        child_id: UUID,
        range_start: date | None,
        range_end: date | None,
        section: PayloadSection,
        required_sections: set[PayloadSection],
    ) -> list:
        if section not in required_sections:
            return []
        if section == "sleeps":
            return self._filter_datetime_items(
                await self._sleep_repo.get_by_child_id(child_id),
                range_start,
                range_end,
                key=lambda item: item.started_at,
            )
        if section == "feedings":
            return self._filter_datetime_items(
                await self._feeding_repo.get_by_child_id(child_id),
                range_start,
                range_end,
                key=lambda item: item.recorded_at,
            )
        if section == "weights":
            return self._filter_datetime_items(
                await self._weight_repo.get_by_child_id(child_id),
                range_start,
                range_end,
                key=lambda item: item.measured_at,
            )
        return self._filter_datetime_items(
            await self._height_repo.get_by_child_id(child_id),
            range_start,
            range_end,
            key=lambda item: item.measured_at,
        )

    async def _require_export_access(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> Child:
        child = await get_child_for_account(self._child_repo, child_id, current_account)
        family = await self._family_repo.get_by_id(child.family_id)
        if family is None:
            raise NotFoundError("Семья не найдена", resource="family")
        plan_policy = resolve_family_plan_policy(family)
        if not plan_policy.can_export_csv:
            raise ValidationError(
                "Экспорт данных доступен только в Plus.",
                code="PLUS_REQUIRED_FOR_CSV_EXPORT",
                status_code=403,
            )
        return child

    async def _load_episode_bundles(
        self,
        child_id: UUID,
        range_start: date | None,
        range_end: date | None,
    ) -> list[EpisodeExportBundle]:
        episodes = await self._episode_repo.get_by_child_id(child_id)
        if not episodes:
            return []
        episode_ids = [episode.id for episode in episodes]
        raw_temperatures_by_episode = await self._temperature_repo.get_by_episode_ids(episode_ids)
        raw_administrations_by_episode = await self._administration_repo.get_by_episode_ids(
            episode_ids
        )
        raw_comments_by_episode = await self._comment_repo.get_by_episode_ids(episode_ids)

        bundles: list[EpisodeExportBundle] = []
        for episode in episodes:
            temperatures = self._filter_datetime_items(
                raw_temperatures_by_episode.get(episode.id, []),
                range_start,
                range_end,
                key=lambda item: item.measured_at,
            )
            administrations = self._filter_datetime_items(
                raw_administrations_by_episode.get(episode.id, []),
                range_start,
                range_end,
                key=lambda item: item.administered_at,
            )
            comments = self._filter_datetime_items(
                raw_comments_by_episode.get(episode.id, []),
                range_start,
                range_end,
                key=lambda item: item.created_at,
            )
            if not self._episode_overlaps_period(
                episode=episode,
                range_start=range_start,
                range_end=range_end,
                has_in_range_activity=bool(temperatures or administrations or comments),
            ):
                continue
            bundles.append(
                EpisodeExportBundle(
                    episode=episode,
                    temperatures=temperatures,
                    administrations=administrations,
                    comments=comments,
                )
            )
        return bundles

    def _episode_overlaps_period(
        self,
        *,
        episode: IllnessEpisode,
        range_start: date | None,
        range_end: date | None,
        has_in_range_activity: bool,
    ) -> bool:
        if range_start is None or range_end is None:
            return True
        if has_in_range_activity:
            return True
        episode_end = episode.closed_at.date() if episode.closed_at is not None else None
        if episode.started_at > range_end:
            return False
        if episode_end is not None and episode_end < range_start:
            return False
        return True

    def _resolve_language(self, preferred_language: str | None) -> AppLanguage:
        return "en" if (preferred_language or "").lower().startswith("en") else "ru"

    def _resolve_period(
        self,
        *,
        period: ExportPeriod,
        start_date: date | None,
        end_date: date | None,
    ) -> tuple[date | None, date | None]:
        if period == "all":
            return None, None
        if period == "month":
            today = date.today()
            return today - timedelta(days=29), today

        resolved_start = start_date or end_date or date.today()
        resolved_end = end_date or start_date or date.today()
        if resolved_start <= resolved_end:
            return resolved_start, resolved_end
        return resolved_end, resolved_start

    def _filter_datetime_items(
        self,
        items: list[T],
        range_start: date | None,
        range_end: date | None,
        *,
        key,
    ) -> list[T]:
        return [
            item
            for item in items
            if self._is_date_in_range(key(item).date(), range_start, range_end)
        ]

    def _is_date_in_range(
        self,
        value: date,
        range_start: date | None,
        range_end: date | None,
    ) -> bool:
        if range_start is not None and value < range_start:
            return False
        if range_end is not None and value > range_end:
            return False
        return True

    def _sanitize_filename_part(self, value: str) -> str:
        sanitized = "_".join(part for part in value.strip().split() if part)
        return sanitized or "child"

    def _sheet_title(self, export_kind: ExportKind) -> str:
        if export_kind == "analytics_summary":
            return "Summary"
        if export_kind == "child_care":
            return "Care"
        return "Illness"

    def _parse_csv_rows(self, csv_content: str) -> list[list[str]]:
        return list(csv_reader(io.StringIO(csv_content)))

    def _build_xlsx_bytes(self, sheets: list[tuple[str, list[list[str]]]]) -> bytes:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", self._xlsx_content_types_xml(len(sheets)))
            archive.writestr("_rels/.rels", self._xlsx_root_rels_xml())
            archive.writestr("xl/workbook.xml", self._xlsx_workbook_xml(sheets))
            archive.writestr(
                "xl/_rels/workbook.xml.rels",
                self._xlsx_workbook_rels_xml(len(sheets)),
            )
            archive.writestr("xl/styles.xml", self._xlsx_styles_xml())
            for index, (_, rows) in enumerate(sheets, start=1):
                archive.writestr(f"xl/worksheets/sheet{index}.xml", self._xlsx_sheet_xml(rows))
        return buffer.getvalue()

    def _xlsx_content_types_xml(self, sheet_count: int) -> str:
        sheet_overrides = "".join(
            (
                f'<Override PartName="/xl/worksheets/sheet{index}.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            )
            for index in range(1, sheet_count + 1)
        )
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" '
            'ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/styles.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            f"{sheet_overrides}"
            "</Types>"
        )

    def _xlsx_root_rels_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" '
            "Type="
            '"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
            'Target="xl/workbook.xml"/>'
            "</Relationships>"
        )

    def _xlsx_workbook_xml(self, sheets: list[tuple[str, list[list[str]]]]) -> str:
        sheet_entries = "".join(
            (f'<sheet name="{escape(title[:31])}" sheetId="{index}" r:id="rId{index}"/>')
            for index, (title, _) in enumerate(sheets, start=1)
        )
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f"<sheets>{sheet_entries}</sheets>"
            "</workbook>"
        )

    def _xlsx_workbook_rels_xml(self, sheet_count: int) -> str:
        sheet_relationships = "".join(
            (
                f'<Relationship Id="rId{index}" '
                "Type="
                '"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                f'Target="worksheets/sheet{index}.xml"/>'
            )
            for index in range(1, sheet_count + 1)
        )
        style_relationship_id = sheet_count + 1
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f"{sheet_relationships}"
            f'<Relationship Id="rId{style_relationship_id}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
            'Target="styles.xml"/>'
            "</Relationships>"
        )

    def _xlsx_styles_xml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<fonts count="2">'
            '<font><sz val="11"/><name val="Calibri"/></font>'
            '<font><b/><sz val="11"/><name val="Calibri"/></font>'
            "</fonts>"
            '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
            '<borders count="1"><border/></borders>'
            '<cellStyleXfs count="1">'
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
            "</cellStyleXfs>"
            '<cellXfs count="2">'
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            "</cellXfs>"
            "</styleSheet>"
        )

    def _xlsx_sheet_xml(self, rows: list[list[str]]) -> str:
        column_count = max((len(row) for row in rows), default=0)
        max_lengths = [0] * column_count
        for row in rows:
            for index, value in enumerate(row):
                max_lengths[index] = max(max_lengths[index], len(value or ""))

        cols_xml = "".join(
            (
                f'<col min="{index}" max="{index}" width="{min(max(length + 2, 10), 48)}" '
                'customWidth="1"/>'
            )
            for index, length in enumerate(max_lengths, start=1)
        )

        sheet_rows_xml = []
        for row_index, row in enumerate(rows, start=1):
            cells_xml = []
            is_header_row = row_index == 1 and len(row) > 1
            for column_index, value in enumerate(row, start=1):
                cell_ref = f"{self._xlsx_column_name(column_index)}{row_index}"
                style_attr = ' s="1"' if is_header_row else ""
                escaped_value = escape(value or "")
                cells_xml.append(f'<c r="{cell_ref}" t="inlineStr"{style_attr}>')
                cells_xml.append(f"<is><t>{escaped_value}</t></is>")
                cells_xml.append("</c>")
            sheet_rows_xml.append(f'<row r="{row_index}">{"".join(cells_xml)}</row>')

        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f"<cols>{cols_xml}</cols>"
            f'<sheetData>{"".join(sheet_rows_xml)}</sheetData>'
            "</worksheet>"
        )

    def _xlsx_column_name(self, index: int) -> str:
        column_name = ""
        current = index
        while current > 0:
            current, remainder = divmod(current - 1, 26)
            column_name = chr(65 + remainder) + column_name
        return column_name
