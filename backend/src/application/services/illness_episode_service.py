"""Сервис эпизодов болезни."""

from datetime import date, datetime, timedelta
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.illness_analytics import (
    EpisodeTemperaturePointDto,
    IllnessAnalyticsDurationBucketDto,
    IllnessAnalyticsSeriesPointDto,
    IllnessEpisodeInsightsDto,
    IllnessHistorySummaryDto,
)
from src.application.dto.illness_episode import (
    IllnessEpisodeCreateDto,
    IllnessEpisodeResponseDto,
    IllnessEpisodeUpdateDto,
)
from src.application.services.access_control import (
    coerce_account_context,
    get_child_for_account,
)
from src.application.services.child_plan_access import (
    ensure_active_illness_continuation_allowed,
    ensure_child_plan_mutation_allowed,
)
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.administration_event import AdministrationEvent
from src.domain.entities.child import Child
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository


class IllnessEpisodeService:
    """Сервис эпизодов болезни: создание, журнал, закрытие."""

    def __init__(
        self,
        episode_repo: IllnessEpisodeRepository,
        child_repo: ChildRepository,
        family_repo: FamilyRepository | None = None,
        account_repo: AccountRepository | None = None,
        temperature_repo: TemperatureEntryRepository | None = None,
        administration_repo: AdministrationEventRepository | None = None,
        comment_repo: IllnessCommentRepository | None = None,
    ) -> None:
        self._repo = episode_repo
        self._child_repo = child_repo
        self._family_repo = family_repo
        self._account_repo = account_repo
        self._temperature_repo = temperature_repo
        self._administration_repo = administration_repo
        self._comment_repo = comment_repo

    def _to_response(self, entity: IllnessEpisode) -> IllnessEpisodeResponseDto:
        return IllnessEpisodeResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            started_at=entity.started_at,
            title=entity.title,
            status=entity.status,
            medication_mode=entity.medication_mode,
            note=entity.note,
            member_account_ids=list(entity.member_account_ids),
            closed_at=entity.closed_at,
        )

    def _current_datetime(self) -> datetime:
        return datetime.now().astimezone()

    def _current_date(self) -> date:
        return self._current_datetime().date()

    async def _resolve_member_account_ids(
        self,
        requested_member_ids: list[UUID] | None,
        current_family_id: UUID,
        child_id: UUID,
    ) -> list[UUID]:
        if self._account_repo is None:
            if requested_member_ids:
                raise ValidationError("Выбор получателей недоступен")
            return []
        accounts = await self._account_repo.list_by_family_id(current_family_id)
        if not accounts:
            raise ValidationError("В семье нет участников для напоминаний")
        family_account_ids = {account.id for account in accounts}
        if requested_member_ids is None:
            return []
        normalized_ids = list(dict.fromkeys(requested_member_ids))
        invalid_ids = [
            account_id for account_id in normalized_ids if account_id not in family_account_ids
        ]
        if invalid_ids:
            raise ForbiddenError("Нельзя выбрать получателей из другой семьи")
        eligible_account_ids = {
            account.id
            for account in accounts
            if self._can_receive_illness_signals_for_child(account, child_id)
        }
        ineligible_ids = [
            account_id for account_id in normalized_ids if account_id not in eligible_account_ids
        ]
        if ineligible_ids:
            raise ForbiddenError("Нельзя выбрать получателей без доступа к ребёнку")
        return normalized_ids

    def _can_receive_illness_signals_for_child(self, account: object, child_id: UUID) -> bool:
        policy = getattr(account, "access_policy", None)
        if policy is None:
            return True
        if getattr(policy, "all_children", False):
            return True
        return child_id in set(getattr(policy, "child_ids", []))

    async def _require_child_access(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> Child:
        return await get_child_for_account(
            self._child_repo,
            child_id,
            current_account,
            required_level,
        )

    async def _get_episode_for_account(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> IllnessEpisode:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._require_child_access(entity.child_id, current_account, required_level)
        return entity

    async def get_by_id(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
    ) -> IllnessEpisodeResponseDto:
        return self._to_response(await self._get_episode_for_account(id, current_account))

    async def get_by_child_id(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[IllnessEpisodeResponseDto]:
        await self._require_child_access(child_id, current_account)
        entities = await self._repo.get_by_child_id(child_id)
        return [self._to_response(e) for e in entities]

    async def get_active_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> IllnessEpisodeResponseDto | None:
        await self._require_child_access(child_id, current_account)
        entity = await self._repo.get_active_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def get_history_summary(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
        period: str,
    ) -> IllnessHistorySummaryDto:
        current_account = coerce_account_context(current_account)
        await self._require_child_access(child_id, current_account)
        normalized_period = self._normalize_period(period)
        temperature_repo, administration_repo, _ = self._require_analytics_repositories()
        all_episodes = await self._repo.get_by_child_id(child_id)
        closed_episodes = [
            episode
            for episode in all_episodes
            if episode.status == "closed" and episode.closed_at is not None
        ]
        filtered_episodes = self._filter_episodes_by_period(closed_episodes, normalized_period)

        episode_temperatures: dict[UUID, list[TemperatureEntry]] = {}
        episode_administrations: dict[UUID, list[AdministrationEvent]] = {}
        for episode in filtered_episodes:
            episode_temperatures[episode.id] = await temperature_repo.get_by_episode_id(episode.id)
            episode_administrations[episode.id] = await administration_repo.get_by_episode_id(
                episode.id
            )

        last_episode = closed_episodes[0] if closed_episodes else None
        durations = [self._episode_duration_days(episode) for episode in filtered_episodes]
        average_duration = round(sum(durations) / len(durations), 1) if durations else 0.0
        longest_duration = max(durations, default=0)
        episodes_with_38_plus = 0
        episodes_with_39_plus = 0
        episodes_with_administrations = 0
        total_temperature_entries = 0
        for episode in filtered_episodes:
            temperatures = episode_temperatures[episode.id]
            administrations = episode_administrations[episode.id]
            total_temperature_entries += len(temperatures)
            if administrations:
                episodes_with_administrations += 1
            max_temperature = max((item.value_celsius for item in temperatures), default=None)
            if max_temperature is not None and max_temperature >= 38:
                episodes_with_38_plus += 1
            if max_temperature is not None and max_temperature >= 39:
                episodes_with_39_plus += 1

        return IllnessHistorySummaryDto(
            period=normalized_period,
            total_closed_episodes=len(closed_episodes),
            episode_count=len(filtered_episodes),
            last_episode_started_at=(last_episode.started_at if last_episode else None),
            days_since_last_episode=(
                self._days_since_episode(last_episode) if last_episode else None
            ),
            most_active_period_label=self._most_active_period_label(
                filtered_episodes,
                normalized_period,
            ),
            average_duration_days=average_duration,
            longest_duration_days=longest_duration,
            episodes_with_temperature_38_plus=episodes_with_38_plus,
            episodes_with_temperature_39_plus=episodes_with_39_plus,
            episodes_with_administrations=episodes_with_administrations,
            observation_only_episodes=max(
                0, len(filtered_episodes) - episodes_with_administrations
            ),
            guided_episodes=sum(
                1 for episode in filtered_episodes if episode.medication_mode == "guided"
            ),
            total_temperature_entries=total_temperature_entries,
            timeline=self._build_timeline(filtered_episodes, normalized_period),
            duration_buckets=self._build_duration_buckets(filtered_episodes),
        )

    async def get_episode_insights(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
    ) -> IllnessEpisodeInsightsDto:
        current_account = coerce_account_context(current_account)
        episode = await self._get_episode_for_account(id, current_account)
        temperature_repo, administration_repo, comment_repo = self._require_analytics_repositories()
        temperatures = await temperature_repo.get_by_episode_id(episode.id)
        administrations = await administration_repo.get_by_episode_id(episode.id)
        comments = await comment_repo.get_by_episode_id(episode.id)

        sorted_temperatures = sorted(temperatures, key=lambda item: item.measured_at)
        sorted_administrations = sorted(administrations, key=lambda item: item.administered_at)
        peak_temperature = max(
            sorted_temperatures,
            key=lambda item: item.value_celsius,
            default=None,
        )
        last_temperature = sorted_temperatures[-1] if sorted_temperatures else None
        last_administration = sorted_administrations[-1] if sorted_administrations else None
        last_event_at = max(
            [
                *[item.measured_at for item in sorted_temperatures],
                *[item.administered_at for item in sorted_administrations],
                *[item.created_at for item in comments],
            ],
            default=None,
        )
        medicine_names = self._resolve_medicine_names(administrations)

        return IllnessEpisodeInsightsDto(
            episode_id=str(episode.id),
            duration_days=self._episode_duration_days(episode),
            peak_temperature_celsius=peak_temperature.value_celsius if peak_temperature else None,
            peak_temperature_at=peak_temperature.measured_at if peak_temperature else None,
            last_temperature_celsius=last_temperature.value_celsius if last_temperature else None,
            last_event_at=last_event_at,
            temperature_count=len(sorted_temperatures),
            administration_count=len(sorted_administrations),
            comment_count=len(comments),
            medication_mode=episode.medication_mode,
            medicine_names=medicine_names,
            total_events=len(sorted_temperatures) + len(sorted_administrations) + len(comments),
            first_temperature_at=(
                sorted_temperatures[0].measured_at if sorted_temperatures else None
            ),
            last_administration_at=(
                last_administration.administered_at if last_administration else None
            ),
            temperature_points=[
                EpisodeTemperaturePointDto(
                    measured_at=item.measured_at,
                    value_celsius=item.value_celsius,
                )
                for item in sorted_temperatures
            ],
        )

    async def create(
        self,
        dto: IllnessEpisodeCreateDto,
        current_account: AuthenticatedAccount,
    ) -> IllnessEpisodeResponseDto:
        current_account = coerce_account_context(current_account)
        await self._require_child_access(dto.child_id, current_account, "edit")
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_account,
            dto.child_id,
        )
        if dto.medication_mode not in {"manual", "guided"}:
            raise ValidationError("Неизвестный режим лекарств")
        active = await self._repo.get_active_by_child_id(dto.child_id)
        if active:
            raise ValidationError(
                "У ребёнка уже есть активный эпизод. " "Закройте его перед созданием нового."
            )
        member_account_ids = await self._resolve_member_account_ids(
            dto.member_account_ids,
            current_account.family_id,
            dto.child_id,
        )
        entity = IllnessEpisode(
            id=uuid4(),
            child_id=dto.child_id,
            started_at=dto.started_at,
            title=dto.title.strip() if dto.title else None,
            status="active",
            medication_mode=dto.medication_mode,
            note=dto.note,
            member_account_ids=member_account_ids,
            closed_at=None,
            deleted_at=None,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(
        self,
        id: UUID,
        dto: IllnessEpisodeUpdateDto,
        current_account: AuthenticatedAccount,
    ) -> IllnessEpisodeResponseDto:
        current_account = coerce_account_context(current_account)
        entity = await self._get_episode_for_account(id, current_account, "edit")
        await ensure_active_illness_continuation_allowed(
            self._family_repo,
            current_account,
            entity.child_id,
            episode_is_active=entity.status == "active",
        )
        fields_set = dto.model_fields_set

        started_at = dto.started_at if "started_at" in fields_set else entity.started_at
        title = (
            dto.title.strip()
            if "title" in fields_set and dto.title
            else (None if "title" in fields_set else entity.title)
        )
        status = dto.status if "status" in fields_set else entity.status
        medication_mode = (
            dto.medication_mode if "medication_mode" in fields_set else entity.medication_mode
        )
        note = dto.note if "note" in fields_set else entity.note
        member_account_ids = (
            await self._resolve_member_account_ids(
                dto.member_account_ids,
                current_account.family_id,
                entity.child_id,
            )
            if "member_account_ids" in fields_set
            else list(entity.member_account_ids)
        )
        closed_at = dto.closed_at if "closed_at" in fields_set else entity.closed_at

        if "started_at" in fields_set and started_at > self._current_date():
            raise ValidationError("Дата начала эпизода не может быть в будущем")
        if closed_at and closed_at.date() < started_at:
            raise ValidationError("Дата закрытия не может быть раньше даты начала эпизода")
        if status not in {"active", "closed"}:
            raise ValidationError("Неизвестный статус эпизода болезни")
        if medication_mode not in {"manual", "guided"}:
            raise ValidationError("Неизвестный режим лекарств")

        if status == "closed" and "closed_at" not in fields_set and closed_at is None:
            closed_at = self._current_datetime()
        if status == "active":
            closed_at = None

        entity = IllnessEpisode(
            id=entity.id,
            child_id=entity.child_id,
            started_at=started_at,
            title=title,
            status=status,
            medication_mode=medication_mode,
            note=note,
            member_account_ids=member_account_ids,
            closed_at=closed_at,
            deleted_at=entity.deleted_at,
        )
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def delete(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        entity = await self._get_episode_for_account(id, current_account, "edit")
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_account,
            entity.child_id,
        )
        await self._repo.delete(id)

    def _normalize_period(self, period: str) -> str:
        normalized_period = period.strip().lower()
        if normalized_period not in {"month", "quarter", "half_year", "year", "all"}:
            raise ValidationError("Неизвестный период аналитики")
        return normalized_period

    def _require_analytics_repositories(
        self,
    ) -> tuple[
        TemperatureEntryRepository,
        AdministrationEventRepository,
        IllnessCommentRepository,
    ]:
        if (
            self._temperature_repo is None
            or self._administration_repo is None
            or self._comment_repo is None
        ):
            raise RuntimeError("Analytics repositories are not configured")
        return self._temperature_repo, self._administration_repo, self._comment_repo

    def _filter_episodes_by_period(
        self,
        episodes: list[IllnessEpisode],
        period: str,
    ) -> list[IllnessEpisode]:
        if period == "all":
            return episodes

        today = self._current_date()
        days_by_period = {
            "month": 30,
            "quarter": 90,
            "half_year": 180,
            "year": 365,
        }
        start_date = today - timedelta(days=days_by_period[period] - 1)
        return [
            episode for episode in episodes if self._episode_reference_date(episode) >= start_date
        ]

    def _episode_duration_days(self, episode: IllnessEpisode) -> int:
        end_date = self._episode_end_date(episode)
        return max(1, (end_date - episode.started_at).days + 1)

    def _episode_end_date(self, episode: IllnessEpisode) -> date:
        return episode.closed_at.date() if episode.closed_at else self._current_date()

    def _episode_reference_date(self, episode: IllnessEpisode) -> date:
        return episode.closed_at.date() if episode.closed_at else episode.started_at

    def _days_since_episode(self, episode: IllnessEpisode) -> int:
        return max(0, (self._current_date() - episode.started_at).days)

    def _most_active_period_label(self, episodes: list[IllnessEpisode], period: str) -> str | None:
        timeline = self._build_timeline(episodes, period)
        non_zero_points = [item for item in timeline if item.value > 0]
        if not non_zero_points:
            return None
        return max(non_zero_points, key=lambda item: item.value).label

    def _build_timeline(
        self,
        episodes: list[IllnessEpisode],
        period: str,
    ) -> list[IllnessAnalyticsSeriesPointDto]:
        if period == "month":
            return self._build_weekly_timeline(episodes)
        if period == "all":
            return self._build_yearly_timeline(episodes)
        return self._build_monthly_timeline(episodes, period)

    def _build_weekly_timeline(
        self,
        episodes: list[IllnessEpisode],
    ) -> list[IllnessAnalyticsSeriesPointDto]:
        today = self._current_date()
        window_start = today - timedelta(days=29)
        buckets = [0, 0, 0, 0]
        for episode in episodes:
            delta_days = (self._episode_reference_date(episode) - window_start).days
            if delta_days < 0 or delta_days > 29:
                continue
            bucket_index = min(3, delta_days // 7)
            buckets[bucket_index] += 1
        return [
            IllnessAnalyticsSeriesPointDto(label=f"{index + 1} нед.", value=value)
            for index, value in enumerate(buckets)
        ]

    def _build_monthly_timeline(
        self,
        episodes: list[IllnessEpisode],
        period: str,
    ) -> list[IllnessAnalyticsSeriesPointDto]:
        months_count = {
            "quarter": 3,
            "half_year": 6,
            "year": 12,
        }[period]
        current = self._current_date().replace(day=1)
        months: list[date] = []
        for _ in range(months_count):
            months.append(current)
            current = self._shift_month(current, -1)
        months.reverse()

        counts = {(month.year, month.month): 0 for month in months}
        for episode in episodes:
            reference_date = self._episode_reference_date(episode)
            key = (reference_date.year, reference_date.month)
            if key in counts:
                counts[key] += 1

        return [
            IllnessAnalyticsSeriesPointDto(
                label=self._month_label(month.month),
                value=counts[(month.year, month.month)],
            )
            for month in months
        ]

    def _build_yearly_timeline(
        self,
        episodes: list[IllnessEpisode],
    ) -> list[IllnessAnalyticsSeriesPointDto]:
        if not episodes:
            current_year = self._current_date().year
            return [IllnessAnalyticsSeriesPointDto(label=str(current_year), value=0)]

        reference_years = [self._episode_reference_date(episode).year for episode in episodes]
        min_year = min(reference_years)
        max_year = max(reference_years)
        counts = {year: 0 for year in range(min_year, max_year + 1)}
        for episode in episodes:
            counts[self._episode_reference_date(episode).year] += 1
        return [
            IllnessAnalyticsSeriesPointDto(label=str(year), value=counts[year])
            for year in range(min_year, max_year + 1)
        ]

    def _build_duration_buckets(
        self,
        episodes: list[IllnessEpisode],
    ) -> list[IllnessAnalyticsDurationBucketDto]:
        counts = {"1-2 дня": 0, "3-5 дней": 0, "6+ дней": 0}
        for episode in episodes:
            duration = self._episode_duration_days(episode)
            if duration <= 2:
                counts["1-2 дня"] += 1
            elif duration <= 5:
                counts["3-5 дней"] += 1
            else:
                counts["6+ дней"] += 1
        return [
            IllnessAnalyticsDurationBucketDto(label=label, value=value)
            for label, value in counts.items()
        ]

    def _resolve_medicine_names(
        self,
        administrations: list[AdministrationEvent],
    ) -> list[str]:
        names: list[str] = []
        for item in administrations:
            name = (item.custom_medicine_name or "").strip()
            if not name and item.household_medicine_id:
                name = "Из аптечки"
            if name and name not in names:
                names.append(name)
        return names

    def _shift_month(self, value: date, delta_months: int) -> date:
        month_index = (value.year * 12 + value.month - 1) + delta_months
        year = month_index // 12
        month = month_index % 12 + 1
        return date(year, month, 1)

    def _month_label(self, month: int) -> str:
        return {
            1: "Янв",
            2: "Фев",
            3: "Мар",
            4: "Апр",
            5: "Май",
            6: "Июн",
            7: "Июл",
            8: "Авг",
            9: "Сен",
            10: "Окт",
            11: "Ноя",
            12: "Дек",
        }[month]
