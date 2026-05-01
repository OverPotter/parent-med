from src.infrastructure.database.models.account import AccountModel


def test_account_push_subscription_relationship_uses_passive_deletes_for_db_cascade() -> None:
    assert AccountModel.push_subscriptions.property.passive_deletes is True
