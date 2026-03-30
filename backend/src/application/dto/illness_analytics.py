"""DTO для аналитики истории болезней и разбора эпизода."""

from datetime import datetime

from pydantic import BaseModel, Field


class IllnessAnalyticsSeriesPointDto(BaseModel):
    """Точка на временной шкале аналитики."""

    label: str = Field(..., description="Подпись периода")
    value: int = Field(..., description="Количество эпизодов в периоде")


class IllnessAnalyticsDurationBucketDto(BaseModel):
    """Корзина по длительности эпизода."""

    label: str = Field(..., description="Подпись диапазона длительности")
    value: int = Field(..., description="Количество эпизодов в диапазоне")


class IllnessHistorySummaryDto(BaseModel):
    """Общая сводка по истории болезней ребёнка за период."""

    period: str = Field(..., description="Выбранный период аналитики")
    total_closed_episodes: int = Field(..., description="Всего завершённых эпизодов в истории")
    episode_count: int = Field(..., description="Количество завершённых эпизодов за период")
    last_episode_started_at: datetime | None = Field(
        None,
        description="Когда начался последний эпизод за всю историю",
    )
    days_since_last_episode: int | None = Field(
        None,
        description="Сколько дней прошло с начала последнего эпизода",
    )
    most_active_period_label: str | None = Field(
        None,
        description="Подпись самого активного месяца/года/недели в выбранном периоде",
    )
    average_duration_days: float = Field(..., description="Средняя длительность эпизода")
    longest_duration_days: int = Field(..., description="Самый долгий эпизод")
    episodes_with_temperature_38_plus: int = Field(
        ...,
        description="Сколько эпизодов имели температуру 38+",
    )
    episodes_with_temperature_39_plus: int = Field(
        ...,
        description="Сколько эпизодов имели температуру 39+",
    )
    episodes_with_administrations: int = Field(
        ...,
        description="Сколько эпизодов были с лекарствами",
    )
    observation_only_episodes: int = Field(
        ...,
        description="Сколько эпизодов прошли без лекарств",
    )
    guided_episodes: int = Field(..., description="Сколько эпизодов были в guided-режиме")
    total_temperature_entries: int = Field(..., description="Суммарно замеров за период")
    timeline: list[IllnessAnalyticsSeriesPointDto] = Field(
        ...,
        description="Временная шкала для графика частоты",
    )
    duration_buckets: list[IllnessAnalyticsDurationBucketDto] = Field(
        ...,
        description="Распределение эпизодов по длительности",
    )


class EpisodeTemperaturePointDto(BaseModel):
    """Точка графика температуры внутри эпизода."""

    measured_at: datetime = Field(..., description="Когда измерили температуру")
    value_celsius: float = Field(..., description="Значение температуры")


class IllnessEpisodeInsightsDto(BaseModel):
    """Разбор конкретного эпизода болезни."""

    episode_id: str = Field(..., description="ID эпизода")
    duration_days: int = Field(..., description="Длительность эпизода в днях")
    peak_temperature_celsius: float | None = Field(
        None,
        description="Максимальная температура в эпизоде",
    )
    peak_temperature_at: datetime | None = Field(
        None,
        description="Когда был пик температуры",
    )
    last_temperature_celsius: float | None = Field(
        None,
        description="Последний замер температуры",
    )
    last_event_at: datetime | None = Field(None, description="Последняя запись в эпизоде")
    temperature_count: int = Field(..., description="Количество замеров")
    administration_count: int = Field(..., description="Количество приёмов")
    comment_count: int = Field(..., description="Количество комментариев")
    medication_mode: str = Field(..., description="Режим приёма лекарств")
    medicine_names: list[str] = Field(..., description="Уникальные препараты в эпизоде")
    total_events: int = Field(..., description="Всего событий в эпизоде")
    first_temperature_at: datetime | None = Field(
        None,
        description="Когда был первый замер температуры",
    )
    last_administration_at: datetime | None = Field(
        None,
        description="Когда был последний приём",
    )
    temperature_points: list[EpisodeTemperaturePointDto] = Field(
        ...,
        description="Точки графика температуры",
    )
