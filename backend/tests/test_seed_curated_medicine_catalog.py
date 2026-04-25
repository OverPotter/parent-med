import pytest

from scripts.seed_curated_medicine_catalog import _validate_payload, _with_catalog_defaults


def test_validate_payload_rejects_duplicate_key_language_pairs() -> None:
    payload = [
        {
            "key": "acetaminophen_tablets",
            "language": "ru",
            "display_name": "Парацетамол",
            "form": "таблетки",
            "strength": "500 мг",
        },
        {
            "key": "acetaminophen_tablets",
            "language": "ru",
            "display_name": "Парацетамол",
            "form": "капсулы",
            "strength": "500 мг",
        },
    ]

    with pytest.raises(ValueError, match="Duplicate key/language pairs"):
        _validate_payload(payload)


def test_validate_payload_rejects_duplicate_cards_with_null_strength() -> None:
    payload = [
        {
            "key": "saline_spray",
            "language": "ru",
            "display_name": "Солевой спрей",
            "form": "спрей",
            "strength": None,
        },
        {
            "key": "saline_mist",
            "language": "ru",
            "display_name": "Солевой спрей",
            "form": "спрей",
            "strength": None,
        },
    ]

    with pytest.raises(ValueError, match="Duplicate catalog cards"):
        _validate_payload(payload)


def test_validate_payload_accepts_unique_cards() -> None:
    payload = [
        {
            "key": "acetaminophen_tablets",
            "language": "ru",
            "display_name": "Парацетамол",
            "form": "таблетки",
            "strength": "500 мг",
        },
        {
            "key": "acetaminophen_tablets",
            "language": "en",
            "display_name": "Acetaminophen",
            "form": "tablets",
            "strength": "500 mg",
        },
        {
            "key": "saline_spray",
            "language": "ru",
            "display_name": "Солевой спрей",
            "form": "спрей",
            "strength": None,
        },
    ]

    _validate_payload(payload)


def test_with_catalog_defaults_infers_dosage_summary_for_common_otc() -> None:
    item = _with_catalog_defaults(
        {
            "key": "paracetamol_child_suspension",
            "language": "ru",
            "display_name": "Парацетамол детский",
            "active_substance": "Парацетамол",
            "form": "суспензия",
            "strength": "120 мг/5 мл",
            "short_description": "Детская форма для жара и боли.",
            "is_otc": True,
            "search_rank": 99,
        }
    )

    assert item["dosage_summary"] is not None
    assert "возрастной" in str(item["dosage_summary"])
    assert item["default_opened_shelf_days"] is None
    assert item["pediatric_dose_mg_per_kg_min"] == 10.0
    assert item["pediatric_dose_mg_per_kg_max"] == 15.0
    assert item["pediatric_dose_note"] is not None


def test_with_catalog_defaults_infers_doctor_only_hint_for_antibiotic() -> None:
    item = _with_catalog_defaults(
        {
            "key": "amoxicillin_suspension",
            "language": "ru",
            "display_name": "Амоксициллин суспензия",
            "active_substance": "Амоксициллин",
            "form": "суспензия",
            "strength": "250 мг/5 мл",
            "short_description": "Детская рецептурная форма антибиотика.",
            "is_otc": False,
            "search_rank": 66,
        }
    )

    assert item["dosage_summary"] is not None
    assert "назначению врача" in str(item["dosage_summary"])
