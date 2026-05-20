"""DTO для агрегированного обзора ребёнка."""

from pydantic import Field

from src.application.dto.base import ResponseBase
from src.application.dto.feeding_record import FeedingRecordResponseDto
from src.application.dto.height_entry import HeightEntryResponseDto
from src.application.dto.illness_episode import IllnessEpisodeResponseDto
from src.application.dto.sleep_session import SleepSessionResponseDto
from src.application.dto.weight_entry import WeightEntryResponseDto


class ChildOverviewResponseDto(ResponseBase):
    """Агрегированный payload для mobile-экрана обзора."""

    feeding_records: list[FeedingRecordResponseDto] = Field(default_factory=list)
    sleep_sessions: list[SleepSessionResponseDto] = Field(default_factory=list)
    weight_entries: list[WeightEntryResponseDto] = Field(default_factory=list)
    height_entries: list[HeightEntryResponseDto] = Field(default_factory=list)
    illness_episodes: list[IllnessEpisodeResponseDto] = Field(default_factory=list)
