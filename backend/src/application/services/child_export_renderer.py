"""CSV rendering helpers for child exports."""

from __future__ import annotations

import csv
import io
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Literal

from src.domain.entities.administration_event import AdministrationEvent
from src.domain.entities.child import Child
from src.domain.entities.feeding_record import FeedingRecord
from src.domain.entities.height_entry import HeightEntry
from src.domain.entities.illness_comment import IllnessComment
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.sleep_session import SleepSession
from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.entities.weight_entry import WeightEntry

ExportKind = Literal["analytics_summary", "child_care", "child_illness"]
AppLanguage = Literal["ru", "en"]

TRANSLATIONS: dict[AppLanguage, dict[str, str]] = {
    "ru": {
        "metric": "Показатель",
        "value": "Значение",
        "child": "Ребёнок",
        "period": "Период",
        "age": "Возраст",
        "latest_weight": "Последний записанный вес",
        "latest_height": "Последний записанный рост",
        "avg_sleep_per_day": "Средний сон в сутки",
        "avg_feedings_per_day": "Кормлений в среднем за день",
        "avg_formula_per_day": "Смеси в среднем за день",
        "illness_episodes": "Эпизодов болезни за период",
        "active_episodes": "Активных эпизодов",
        "max_temperature": "Максимальная температура",
        "medications_count": "Записанных приёмов лекарств",
        "section": "Раздел",
        "event": "Что произошло",
        "date": "Дата",
        "time": "Время",
        "record": "Что записано",
        "details": "Подробности",
        "note": "Заметка",
        "sleep_records": "Всего снов",
        "avg_sleeps_per_day": "Снов за день в среднем",
        "avg_sleep_duration": "Средняя длительность сна",
        "feeding_records": "Всего кормлений",
        "avg_formula_volume": "Средний объём смеси за одно кормление",
        "formula_per_day": "Средний объём смеси за день",
        "sleep": "Сон",
        "feeding": "Кормление",
        "weight": "Вес",
        "height": "Рост",
        "night_sleep": "Ночной сон",
        "day_sleep": "Дневной сон",
        "sleep_in_progress": "Сон идёт сейчас",
        "expressed": "Сцеженное",
        "episode": "Эпизод",
        "temperature": "Температура",
        "medication": "Лекарство",
        "comment": "Комментарий",
        "medicine": "Лекарство",
        "author": "Кто внёс",
        "status": "Статус",
        "all_time": "Все время",
        "untitled_episode": "Эпизод без названия",
    },
    "en": {
        "metric": "Metric",
        "value": "Value",
        "child": "Child",
        "period": "Period",
        "age": "Age",
        "latest_weight": "Latest weight",
        "latest_height": "Latest height",
        "avg_sleep_per_day": "Average sleep per day",
        "avg_feedings_per_day": "Average feedings per day",
        "avg_formula_per_day": "Average formula per day",
        "illness_episodes": "Illness episodes in period",
        "active_episodes": "Active episodes",
        "max_temperature": "Maximum temperature",
        "medications_count": "Medication administrations",
        "section": "Section",
        "event": "Event",
        "date": "Date",
        "time": "Time",
        "record": "Recorded",
        "details": "Details",
        "note": "Note",
        "sleep_records": "Total sleeps",
        "avg_sleeps_per_day": "Sleeps per day on average",
        "avg_sleep_duration": "Average sleep duration",
        "feeding_records": "Total feedings",
        "avg_formula_volume": "Average formula volume per feeding",
        "formula_per_day": "Average formula volume per day",
        "sleep": "Sleep",
        "feeding": "Feeding",
        "weight": "Weight",
        "height": "Height",
        "night_sleep": "Night sleep",
        "day_sleep": "Day sleep",
        "sleep_in_progress": "Sleep in progress",
        "expressed": "Expressed milk",
        "episode": "Episode",
        "temperature": "Temperature",
        "medication": "Medication",
        "comment": "Comment",
        "medicine": "Medicine",
        "author": "Recorded by",
        "status": "Status",
        "all_time": "All time",
        "untitled_episode": "Untitled episode",
    },
}


@dataclass(slots=True)
class EpisodeExportBundle:
    episode: IllnessEpisode
    temperatures: list[TemperatureEntry]
    administrations: list[AdministrationEvent]
    comments: list[IllnessComment]


@dataclass(slots=True)
class ChildExportPayload:
    child: Child
    language: AppLanguage
    range_start: date | None
    range_end: date | None
    sleeps: list[SleepSession]
    feedings: list[FeedingRecord]
    weights: list[WeightEntry]
    heights: list[HeightEntry]
    episode_bundles: list[EpisodeExportBundle]


class ChildExportRenderer:
    """Render user-friendly CSV files from prepared child export payloads."""

    def render_csv(self, export_kind: ExportKind, payload: ChildExportPayload) -> str:
        if export_kind == "analytics_summary":
            return self._render_analytics_summary_csv(payload)
        if export_kind == "child_care":
            return self._render_child_care_csv(payload)
        return self._render_child_illness_csv(payload)

    def _render_analytics_summary_csv(self, payload: ChildExportPayload) -> str:
        child = payload.child
        language = payload.language
        last_weight = max(payload.weights, key=lambda item: item.measured_at, default=None)
        last_height = max(payload.heights, key=lambda item: item.measured_at, default=None)
        sleep_minutes = sum(self._sleep_duration_minutes(item) for item in payload.sleeps)
        formula_volume = sum(item.formula_volume_ml or 0 for item in payload.feedings)
        temperatures = [item for bundle in payload.episode_bundles for item in bundle.temperatures]
        administrations = [
            item for bundle in payload.episode_bundles for item in bundle.administrations
        ]
        day_count = self._resolve_day_count(payload)
        max_temperature = max((item.value_celsius for item in temperatures), default=None)

        rows = [
            [self._t(language, "metric"), self._t(language, "value")],
            [self._t(language, "child"), child.name],
            [
                self._t(language, "period"),
                self._format_period_label(payload.range_start, payload.range_end, language),
            ],
        ]
        self._append_summary_row(
            rows,
            self._t(language, "age"),
            self._format_age_label(
                child.birth_date,
                language,
                today=payload.range_end or date.today(),
            ),
        )
        self._append_summary_row(
            rows,
            self._t(language, "latest_weight"),
            self._format_weight(last_weight, language),
        )
        self._append_summary_row(
            rows,
            self._t(language, "latest_height"),
            self._format_height(last_height, language),
        )
        if sleep_minutes > 0:
            self._append_summary_row(
                rows,
                self._t(language, "avg_sleep_per_day"),
                self._format_duration_human(round(sleep_minutes / day_count), language),
            )
        if payload.feedings:
            self._append_summary_row(
                rows,
                self._t(language, "avg_feedings_per_day"),
                self._format_decimal(len(payload.feedings) / day_count, language),
            )
        if formula_volume > 0:
            self._append_summary_row(
                rows,
                self._t(language, "avg_formula_per_day"),
                self._format_volume(formula_volume / day_count, language),
            )
        if payload.episode_bundles:
            self._append_summary_row(
                rows,
                self._t(language, "illness_episodes"),
                str(len(payload.episode_bundles)),
            )
            active_episodes = sum(
                1 for bundle in payload.episode_bundles if bundle.episode.status == "active"
            )
            if active_episodes > 0:
                self._append_summary_row(
                    rows,
                    self._t(language, "active_episodes"),
                    str(active_episodes),
                )
        if max_temperature is not None:
            self._append_summary_row(
                rows,
                self._t(language, "max_temperature"),
                self._format_temperature(max_temperature, language),
            )
        if administrations:
            self._append_summary_row(
                rows,
                self._t(language, "medications_count"),
                str(len(administrations)),
            )
        return self._write_csv(rows)

    def _render_child_care_csv(self, payload: ChildExportPayload) -> str:
        language = payload.language
        rows: list[list[str]] = [
            [self._t(language, "child"), payload.child.name],
            [
                self._t(language, "period"),
                self._format_period_label(payload.range_start, payload.range_end, language),
            ],
            [],
        ]
        table_header = self._child_care_table_header(language)
        self._append_child_care_block(
            rows,
            self._t(language, "sleep"),
            table_header,
            self._build_child_care_sleep_rows(payload),
        )
        self._append_child_care_block(
            rows,
            self._t(language, "feeding"),
            table_header,
            self._build_child_care_feeding_rows(payload),
        )
        self._append_child_care_block(
            rows,
            self._t(language, "weight"),
            table_header,
            self._build_measurement_rows(payload, measurement="weight"),
        )
        self._append_child_care_block(
            rows,
            self._t(language, "height"),
            table_header,
            self._build_measurement_rows(payload, measurement="height"),
        )
        return self._write_csv(rows)

    def _render_child_illness_csv(self, payload: ChildExportPayload) -> str:
        language = payload.language
        rows = [
            [self._t(language, "child"), payload.child.name],
            [
                self._t(language, "period"),
                self._format_period_label(payload.range_start, payload.range_end, language),
            ],
            [],
            self._child_illness_table_header(language),
        ]

        for bundle in payload.episode_bundles:
            episode = bundle.episode
            rows.append(
                [
                    episode.title or self._t(language, "untitled_episode"),
                    "",
                    self._format_date(episode.started_at, language),
                    "",
                    "",
                    "",
                    "",
                    self._episode_status_label(episode.status, language),
                    self._episode_mode_label(episode.medication_mode, language),
                    episode.note or "",
                ]
            )

            rows.extend(self._build_episode_timeline_rows(bundle, language))

        return self._write_csv(rows)

    def _resolve_day_count(self, payload: ChildExportPayload) -> int:
        if payload.range_start is not None and payload.range_end is not None:
            return max(1, (payload.range_end - payload.range_start).days + 1)

        candidate_dates: list[date] = []
        candidate_dates.extend(bundle.episode.started_at for bundle in payload.episode_bundles)
        candidate_dates.extend(item.started_at.date() for item in payload.sleeps)
        candidate_dates.extend(item.recorded_at.date() for item in payload.feedings)
        candidate_dates.extend(item.measured_at.date() for item in payload.weights)
        candidate_dates.extend(item.measured_at.date() for item in payload.heights)
        for bundle in payload.episode_bundles:
            candidate_dates.extend(item.measured_at.date() for item in bundle.temperatures)
            candidate_dates.extend(item.administered_at.date() for item in bundle.administrations)
            candidate_dates.extend(item.created_at.date() for item in bundle.comments)
        if not candidate_dates:
            return 1
        return max(1, (max(candidate_dates) - min(candidate_dates)).days + 1)

    def _sleep_duration_minutes(self, session: SleepSession) -> int:
        if session.ended_at is not None:
            delta = session.ended_at - session.started_at
            return max(0, int(delta.total_seconds() // 60))
        return 0

    def _append_summary_row(self, rows: list[list[str]], label: str, value: str) -> None:
        if value == "—":
            return
        rows.append([label, value])

    def _child_care_table_header(self, language: AppLanguage) -> list[str]:
        return [
            self._t(language, "date"),
            self._t(language, "time"),
            self._t(language, "record"),
            self._t(language, "details"),
            self._t(language, "note"),
        ]

    def _build_child_care_sleep_rows(self, payload: ChildExportPayload) -> list[list[str]]:
        language = payload.language
        sleep_rows: list[list[str]] = []
        day_sleep_counts: dict[date, int] = defaultdict(int)
        for item in sorted(payload.sleeps, key=lambda session: session.started_at):
            duration_minutes = self._sleep_duration_minutes(item)
            sleep_kind = self._resolve_sleep_kind(item)
            record = self._sleep_record_label(
                session=item,
                sleep_kind=sleep_kind,
                day_sleep_counts=day_sleep_counts,
                language=language,
            )
            details = (
                self._t(language, "sleep_in_progress")
                if item.ended_at is None and item.status == "active"
                else self._format_duration_human(duration_minutes, language)
            )
            sleep_rows.append(
                [
                    self._format_date(item.started_at.date(), language),
                    self._format_time_range(item.started_at, item.ended_at),
                    record,
                    details,
                    "",
                ]
            )
        return sleep_rows

    def _build_child_care_feeding_rows(self, payload: ChildExportPayload) -> list[list[str]]:
        language = payload.language
        rows: list[list[str]] = []
        for item in payload.feedings:
            details: list[str] = []
            if item.feeding_type == "breast" and item.breast_side:
                details.append(self._feeding_side_label(item.breast_side, language))
            if item.is_expressed:
                details.append(self._t(language, "expressed"))
            if item.formula_volume_ml:
                details.append(self._format_volume(item.formula_volume_ml, language))
            if item.duration_minutes:
                details.append(self._format_duration_human(item.duration_minutes, language))
            rows.append(
                [
                    self._format_date(item.recorded_at.date(), language),
                    self._format_time_range(
                        item.started_at or item.recorded_at,
                        item.ended_at,
                        fallback_to_single_time=True,
                    ),
                    self._feeding_type_label(item.feeding_type, language),
                    ", ".join(detail for detail in details if detail),
                    item.note or "",
                ]
            )
        return rows

    def _build_measurement_rows(
        self,
        payload: ChildExportPayload,
        *,
        measurement: Literal["weight", "height"],
    ) -> list[list[str]]:
        language = payload.language
        if measurement == "weight":
            return [
                [
                    self._format_date(item.measured_at.date(), language),
                    self._format_time(item.measured_at),
                    self._t(language, "weight"),
                    self._format_weight(item, language),
                    "",
                ]
                for item in payload.weights
            ]
        return [
            [
                self._format_date(item.measured_at.date(), language),
                self._format_time(item.measured_at),
                self._t(language, "height"),
                self._format_height(item, language),
                "",
            ]
            for item in payload.heights
        ]

    def _append_child_care_block(
        self,
        rows: list[list[str]],
        title: str,
        header: list[str],
        block_rows: list[list[str]],
    ) -> None:
        if not block_rows:
            return
        rows.append([title])
        rows.append(header)
        rows.extend(block_rows)
        rows.append([])

    def _child_illness_table_header(self, language: AppLanguage) -> list[str]:
        return [
            self._t(language, "episode"),
            self._t(language, "event"),
            self._t(language, "date"),
            self._t(language, "time"),
            self._t(language, "value"),
            self._t(language, "medicine"),
            self._t(language, "author"),
            self._t(language, "status"),
            self._t(language, "details"),
            self._t(language, "note"),
        ]

    def _build_episode_timeline_rows(
        self,
        bundle: EpisodeExportBundle,
        language: AppLanguage,
    ) -> list[list[str]]:
        timeline: list[tuple[datetime, list[str]]] = []
        for item in bundle.temperatures:
            timeline.append(
                (
                    item.measured_at,
                    [
                        "",
                        self._t(language, "temperature"),
                        self._format_date(item.measured_at.date(), language),
                        self._format_time(item.measured_at),
                        self._format_temperature(item.value_celsius, language),
                        "",
                        item.created_by_name_snapshot or "",
                        "",
                        self._temperature_method_label(item.method, language),
                        item.comment or "",
                    ],
                )
            )
        for item in bundle.administrations:
            medicine_name = item.custom_medicine_name or self._t(language, "medicine")
            timeline.append(
                (
                    item.administered_at,
                    [
                        "",
                        self._t(language, "medication"),
                        self._format_date(item.administered_at.date(), language),
                        self._format_time(item.administered_at),
                        self._format_medication_amount(item),
                        medicine_name,
                        item.administered_by_name_snapshot or "",
                        "",
                        item.reason or "",
                        "",
                    ],
                )
            )
        for item in bundle.comments:
            timeline.append(
                (
                    item.created_at,
                    [
                        "",
                        self._t(language, "comment"),
                        self._format_date(item.created_at.date(), language),
                        self._format_time(item.created_at),
                        "",
                        "",
                        item.created_by_name_snapshot or "",
                        "",
                        "",
                        item.text,
                    ],
                )
            )
        timeline.sort(key=lambda entry: entry[0])
        return [row for _, row in timeline]

    def _resolve_sleep_kind(self, session: SleepSession) -> Literal["night", "day"]:
        if session.ended_at is None:
            return (
                "night" if (session.started_at.hour >= 21 or session.started_at.hour < 6) else "day"
            )

        if session.ended_at.date() != session.started_at.date():
            return "night"

        total_minutes = self._sleep_duration_minutes(session)
        night_minutes = self._minutes_in_night_window(session.started_at, session.ended_at)
        if total_minutes >= 180 and night_minutes >= max(120, total_minutes // 2):
            return "night"
        if session.started_at.hour >= 21 or session.started_at.hour < 6:
            return "night"
        return "day"

    def _minutes_in_night_window(self, started_at: datetime, ended_at: datetime) -> int:
        if ended_at <= started_at:
            return 0

        total_overlap = 0
        current_date = started_at.date() - timedelta(days=1)
        last_date = ended_at.date()
        while current_date <= last_date:
            night_start = datetime.combine(current_date, time(21, 0), tzinfo=started_at.tzinfo)
            night_end = datetime.combine(
                current_date + timedelta(days=1),
                time(7, 0),
                tzinfo=started_at.tzinfo,
            )
            overlap_start = max(started_at, night_start)
            overlap_end = min(ended_at, night_end)
            if overlap_end > overlap_start:
                total_overlap += int((overlap_end - overlap_start).total_seconds() // 60)
            current_date += timedelta(days=1)
        return total_overlap

    def _sleep_record_label(
        self,
        *,
        session: SleepSession,
        sleep_kind: Literal["night", "day"],
        day_sleep_counts: dict[date, int],
        language: AppLanguage,
    ) -> str:
        if sleep_kind == "night":
            return self._t(language, "night_sleep")

        day_key = session.started_at.date()
        day_sleep_counts[day_key] += 1
        return f"{self._t(language, 'day_sleep')} {day_sleep_counts[day_key]}"

    def _format_period_label(
        self,
        range_start: date | None,
        range_end: date | None,
        language: AppLanguage,
    ) -> str:
        if range_start is None or range_end is None:
            return self._t(language, "all_time")
        if range_start == range_end:
            return self._format_date(range_start, language)
        start_label = self._format_date(range_start, language)
        end_label = self._format_date(range_end, language)
        return f"{start_label}-{end_label}"

    def _format_date(self, value: date, language: AppLanguage) -> str:
        if language == "ru":
            return value.strftime("%d.%m.%Y")
        return value.strftime("%Y-%m-%d")

    def _format_time(self, value: datetime) -> str:
        return value.strftime("%H:%M")

    def _format_time_range(
        self,
        started_at: datetime,
        ended_at: datetime | None,
        *,
        fallback_to_single_time: bool = False,
    ) -> str:
        if ended_at is None:
            return started_at.strftime("%H:%M") if fallback_to_single_time else ""
        return f"{started_at.strftime('%H:%M')}-{ended_at.strftime('%H:%M')}"

    def _format_duration_human(self, minutes: int | None, language: AppLanguage) -> str:
        if minutes is None or minutes <= 0:
            return "—"
        hours = minutes // 60
        remaining_minutes = minutes % 60
        if language == "ru":
            if hours and remaining_minutes:
                return f"{hours} ч {remaining_minutes:02d} мин"
            if hours:
                return f"{hours} ч"
            return f"{remaining_minutes} мин"
        if hours and remaining_minutes:
            return f"{hours} h {remaining_minutes:02d} min"
        if hours:
            return f"{hours} h"
        return f"{remaining_minutes} min"

    def _format_weight(self, item: WeightEntry | None, language: AppLanguage) -> str:
        if item is None:
            return "—"
        unit = "кг" if language == "ru" else "kg"
        return f"{self._format_decimal(item.value_kg, language)} {unit}"

    def _format_height(self, item: HeightEntry | None, language: AppLanguage) -> str:
        if item is None:
            return "—"
        unit = "см" if language == "ru" else "cm"
        return f"{self._format_decimal(item.value_cm, language)} {unit}"

    def _format_volume(self, value_ml: float | int | None, language: AppLanguage) -> str:
        if value_ml is None:
            return "—"
        unit = "мл" if language == "ru" else "ml"
        return f"{self._format_decimal(value_ml, language)} {unit}"

    def _format_temperature(self, value_celsius: float | None, language: AppLanguage) -> str:
        if value_celsius is None:
            return "—"
        return f"{self._format_decimal(value_celsius, language)} °C"

    def _format_decimal(self, value: float | int, language: AppLanguage) -> str:
        if isinstance(value, int) or float(value).is_integer():
            return str(int(round(float(value))))
        formatted = f"{float(value):.1f}"
        return formatted.replace(".", ",") if language == "ru" else formatted

    def _format_medication_amount(self, item: AdministrationEvent) -> str:
        if item.unit and item.amount.endswith(item.unit):
            return item.amount
        if item.unit:
            return f"{item.amount} {item.unit}"
        return item.amount

    def _temperature_method_label(self, method: str | None, language: AppLanguage) -> str:
        if not method:
            return ""
        labels = {
            "ru": {
                "axillary": "Подмышкой",
                "oral": "Во рту",
                "rectal": "Ректально",
                "ear": "В ухе",
                "forehead": "На лбу",
            },
            "en": {
                "axillary": "Axillary",
                "oral": "Oral",
                "rectal": "Rectal",
                "ear": "Ear",
                "forehead": "Forehead",
            },
        }
        return labels[language].get(method, method)

    def _feeding_type_label(self, feeding_type: str, language: AppLanguage) -> str:
        labels = {
            "ru": {
                "breast": "Грудное кормление",
                "formula": "Смесь",
            },
            "en": {
                "breast": "Breastfeeding",
                "formula": "Formula",
            },
        }
        return labels[language].get(feeding_type, feeding_type)

    def _feeding_side_label(self, side: str, language: AppLanguage) -> str:
        labels = {
            "ru": {"left": "Левая сторона", "right": "Правая сторона", "both": "Обе стороны"},
            "en": {"left": "Left side", "right": "Right side", "both": "Both sides"},
        }
        return labels[language].get(side, side)

    def _episode_status_label(self, status: str, language: AppLanguage) -> str:
        labels = {
            "ru": {"active": "Активен", "closed": "Завершён"},
            "en": {"active": "Active", "closed": "Closed"},
        }
        return labels[language].get(status, status)

    def _episode_mode_label(self, mode: str, language: AppLanguage) -> str:
        labels = {
            "ru": {"guided": "План приёма", "manual": "Ручной журнал"},
            "en": {"guided": "Medication plan", "manual": "Manual log"},
        }
        return labels[language].get(mode, "")

    def _format_age_label(
        self,
        birth_date: date | None,
        language: AppLanguage,
        *,
        today: date | None = None,
    ) -> str:
        if birth_date is None:
            return "—"
        resolved_today = today or date.today()
        total_months = (
            (resolved_today.year - birth_date.year) * 12
            + resolved_today.month
            - birth_date.month
            - int(resolved_today.day < birth_date.day)
        )
        if total_months < 0:
            return "—"
        if total_months < 12:
            return f"{total_months} мес." if language == "ru" else f"{total_months} mo"
        years = total_months // 12
        months = total_months % 12
        if language == "ru":
            if months == 0:
                return f"{years} {self._ru_year_word(years)}"
            return f"{years} {self._ru_year_word(years)} {months} мес."
        if months == 0:
            return f"{years} y"
        return f"{years} y {months} mo"

    def _ru_year_word(self, years: int) -> str:
        remainder_100 = years % 100
        remainder_10 = years % 10
        if 11 <= remainder_100 <= 14:
            return "лет"
        if remainder_10 == 1:
            return "год"
        if 2 <= remainder_10 <= 4:
            return "года"
        return "лет"

    def _write_csv(self, rows: list[list[str]]) -> str:
        buffer = io.StringIO(newline="")
        writer = csv.writer(buffer)
        writer.writerows(rows)
        return buffer.getvalue()

    def _t(self, language: AppLanguage, key: str) -> str:
        return TRANSLATIONS[language][key]
