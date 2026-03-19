from src.infrastructure.database.models.child import ChildModel


def test_child_relationships_use_passive_deletes_for_db_cascade() -> None:
    assert ChildModel.weight_entries.property.passive_deletes is True
    assert ChildModel.illness_episodes.property.passive_deletes is True
