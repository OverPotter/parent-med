"""Загрузка curated-справочника препаратов из локальных seed-файлов."""

from __future__ import annotations

import asyncio
import importlib.util
import json
from collections import defaultdict
from pathlib import Path
from uuid import UUID, NAMESPACE_URL, uuid5

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.infrastructure.database.models.curated_medicine_catalog_item import (
    CuratedMedicineCatalogItemModel,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SEED_PATTERNS = ("curated_medicine_catalog_seed*.json", "curated_medicine_catalog_seed*.py")

DOSAGE_HINT_RULES: list[tuple[tuple[str, ...], str, str]] = [
    (
        ("paracetamol", "acetaminophen"),
        "По возрастной или весовой инструкции на упаковке; не превышать суточный максимум.",
        "Use the age- or weight-based label directions; do not exceed the daily maximum.",
    ),
    (
        ("ibuprofen",),
        "По возрастной или весовой инструкции на упаковке, обычно каждые 6-8 часов; лучше после еды.",
        "Use the age- or weight-based label directions, usually every 6 to 8 hours; best taken with food.",
    ),
    (
        ("aspirin", "naproxen", "diclofenac", "ketorolac", "meloxicam"),
        "По инструкции или назначению врача; не комбинировать с другими НПВС без рекомендации врача.",
        "Use as directed or prescribed; do not combine with other NSAIDs unless advised by a clinician.",
    ),
    (
        ("cetirizine", "loratadine", "levocetirizine", "desloratadine", "fexofenadine"),
        "Обычно 1 раз в день по инструкции на упаковке или назначению врача.",
        "Usually taken once daily per the label or clinician instructions.",
    ),
    (
        ("diphenhydramine", "chlorpheniramine"),
        "По инструкции на упаковке; может вызывать сонливость.",
        "Use as directed on the label; may cause drowsiness.",
    ),
    (
        ("saline_nasal", "saline_rinse"),
        "По необходимости для промывания или увлажнения носа.",
        "Use as needed to rinse or moisturize the nose.",
    ),
    (
        ("phenylephrine", "oxymetazoline", "pseudoephedrine"),
        "Коротким курсом строго по инструкции на упаковке; не использовать дольше нескольких дней подряд без врача.",
        "Use short-term exactly as directed on the label; do not use for more than a few days in a row without medical advice.",
    ),
    (
        ("dextromethorphan",),
        "По инструкции на упаковке для возраста; не сочетать с другими средствами с декстрометорфаном.",
        "Use the age-appropriate label directions; avoid combining with other products containing dextromethorphan.",
    ),
    (
        ("guaifenesin",),
        "По инструкции на упаковке; запивать водой.",
        "Use as directed on the label and drink plenty of water.",
    ),
    (
        ("ors",),
        "Разводить строго по инструкции пакета и давать часто маленькими порциями.",
        "Mix exactly as directed on the packet and give small, frequent sips.",
    ),
    (
        ("bismuth", "loperamide", "simethicone", "calcium_carb", "famotidine", "omeprazole"),
        "По инструкции на упаковке; при выраженных или затяжных симптомах нужен врач.",
        "Use as directed on the label; seek medical care for severe or persistent symptoms.",
    ),
    (
        ("polyethylene_glycol", "lactulose", "psyllium", "docusate", "glycerin", "bisacodyl", "senna"),
        "По инструкции на упаковке или назначению врача; пить достаточно жидкости.",
        "Use as directed on the label or by a clinician; drink enough fluids.",
    ),
    (
        ("ondansetron", "dimenhydrinate", "meclizine"),
        "По инструкции или назначению врача при тошноте и укачивании.",
        "Use as directed or prescribed for nausea or motion sickness.",
    ),
    (
        ("chlorhexidine", "hydrocortisone", "bacitracin", "clotrimazole", "miconazole", "mupirocin", "permethrin", "pramoxine", "benzoyl_peroxide", "ketoconazole", "selenium_sulfide", "acyclovir_topical"),
        "Наносить по инструкции на упаковке или назначению врача на чистую сухую кожу.",
        "Apply to clean, dry skin as directed on the label or by a clinician.",
    ),
    (
        ("eye_drops", "_oph", "ophthalmic", "_otic", "otic"),
        "Использовать по инструкции или назначению врача; не касаться кончиком флакона глаза или уха.",
        "Use as directed or prescribed; do not touch the bottle tip to the eye or ear.",
    ),
    (
        ("amoxicillin", "amoxclav", "azithromycin", "cefuroxime", "cefixime", "cefaclor", "cefprozil", "cephalexin", "trimethoprim", "nitrofurantoin", "erythromycin_extra", "erythromycin_tablets", "erythromycin"),
        "Только по назначению врача, курсом по схеме врача; не прекращать раньше времени без согласования.",
        "Prescription only; take the full course exactly as prescribed and do not stop early unless instructed.",
    ),
    (
        ("prednisolone", "prednisone", "baclofen", "cyclobenzaprine", "methocarbamol", "tizanidine", "montelukast", "albuterol", "budesonide", "fluticasone", "beclomethasone"),
        "Только по инструкции или назначению врача.",
        "Use only as directed on the label or by a clinician.",
    ),
]

PEDIATRIC_DOSE_RULES: list[tuple[tuple[str, ...], float | None, float | None, str, str]] = [
    (
        ("paracetamol", "acetaminophen"),
        10.0,
        15.0,
        "Типичный ориентир для детей: 10-15 мг/кг на приём каждые 4-6 часов, не больше 4-5 приёмов в сутки по инструкции.",
        "Typical pediatric reference: 10-15 mg/kg per dose every 4 to 6 hours; do not exceed the label's daily limit.",
    ),
    (
        ("ibuprofen",),
        10.0,
        10.0,
        "Типичный ориентир для детей: 10 мг/кг на приём каждые 6-8 часов по инструкции.",
        "Typical pediatric reference: 10 mg/kg per dose every 6 to 8 hours as directed on the label.",
    ),
]


def _stable_id(key: str, language: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"pillpath-curated-catalog:{key}:{language}")


def _infer_dosage_summary(key: str, language: str) -> str | None:
    for patterns, ru_text, en_text in DOSAGE_HINT_RULES:
        if any(pattern in key for pattern in patterns):
            return ru_text if language == "ru" else en_text
    return None


def _with_catalog_defaults(item: dict[str, object]) -> dict[str, object]:
    enriched = dict(item)
    key = str(enriched["key"])
    language = str(enriched["language"])
    enriched.setdefault("dosage_summary", _infer_dosage_summary(key, language))
    pediatric_min, pediatric_max, pediatric_note = _infer_pediatric_dose(key, language)
    enriched.setdefault("pediatric_dose_mg_per_kg_min", pediatric_min)
    enriched.setdefault("pediatric_dose_mg_per_kg_max", pediatric_max)
    enriched.setdefault("pediatric_dose_note", pediatric_note)
    enriched.setdefault("default_opened_shelf_days", None)
    return enriched


def _infer_pediatric_dose(
    key: str,
    language: str,
) -> tuple[float | None, float | None, str | None]:
    for patterns, min_value, max_value, ru_text, en_text in PEDIATRIC_DOSE_RULES:
        if any(pattern in key for pattern in patterns):
            return min_value, max_value, ru_text if language == "ru" else en_text
    return None, None, None


def _load_seed_payload() -> tuple[list[dict[str, object]], list[Path]]:
    payload: list[dict[str, object]] = []
    seed_paths = sorted({path for pattern in SEED_PATTERNS for path in DATA_DIR.glob(pattern)})
    for seed_path in seed_paths:
        if seed_path.suffix == ".json":
            payload.extend(_with_catalog_defaults(item) for item in json.loads(seed_path.read_text(encoding="utf-8")))
            continue
        module_name = f"seed_{seed_path.stem}"
        spec = importlib.util.spec_from_file_location(module_name, seed_path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Cannot load seed module: {seed_path}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        payload.extend(_with_catalog_defaults(item) for item in getattr(module, "SEED_DATA"))
    return payload, seed_paths


def _validate_payload(payload: list[dict[str, object]]) -> None:
    if not payload:
        raise ValueError("Curated medicine catalog seed is empty")

    duplicate_ids: defaultdict[tuple[str, str], list[str]] = defaultdict(list)
    duplicate_cards: defaultdict[tuple[str, str, str, str], list[str]] = defaultdict(list)

    for item in payload:
        key = str(item["key"])
        language = str(item["language"])
        display_name = str(item["display_name"])
        form = str(item["form"])
        strength = "" if item["strength"] is None else str(item["strength"])

        duplicate_ids[(key, language)].append(display_name)
        duplicate_cards[(language, display_name, form, strength)].append(key)

    duplicated_key_lang = {
        pair: values for pair, values in duplicate_ids.items() if len(values) > 1
    }
    if duplicated_key_lang:
        conflicts = ", ".join(f"{key}/{language}" for key, language in duplicated_key_lang)
        raise ValueError(f"Duplicate key/language pairs in curated catalog seed: {conflicts}")

    duplicated_cards = {
        card: keys for card, keys in duplicate_cards.items() if len(keys) > 1
    }
    if duplicated_cards:
        conflicts = ", ".join(
            f"{language}:{display_name}:{form}:{strength or '<empty>'}"
            for language, display_name, form, strength in duplicated_cards
        )
        raise ValueError(
            "Duplicate catalog cards in curated catalog seed: "
            f"{conflicts}"
        )


async def main() -> None:
    payload, seed_paths = _load_seed_payload()
    _validate_payload(payload)

    rows: list[dict[str, object]] = []
    for item in payload:
        rows.append(
            {
                "id": _stable_id(item["key"], item["language"]),
                "language": item["language"],
                "display_name": item["display_name"],
                "active_substance": item["active_substance"],
                "form": item["form"],
                "strength": item["strength"],
                "short_description": item["short_description"],
                "dosage_summary": item.get("dosage_summary"),
                "pediatric_dose_mg_per_kg_min": item.get("pediatric_dose_mg_per_kg_min"),
                "pediatric_dose_mg_per_kg_max": item.get("pediatric_dose_mg_per_kg_max"),
                "pediatric_dose_note": item.get("pediatric_dose_note"),
                "default_opened_shelf_days": item.get("default_opened_shelf_days"),
                "is_otc": item["is_otc"],
                "is_home_cabinet_relevant": True,
                "search_rank": item["search_rank"],
            }
        )

    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        seeded_ids = [row["id"] for row in rows]
        delete_stmt = delete(CuratedMedicineCatalogItemModel).where(
            CuratedMedicineCatalogItemModel.id.not_in(seeded_ids)
        )
        await session.execute(delete_stmt)

        stmt = insert(CuratedMedicineCatalogItemModel).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "language": stmt.excluded.language,
                "display_name": stmt.excluded.display_name,
                "active_substance": stmt.excluded.active_substance,
                "form": stmt.excluded.form,
                "strength": stmt.excluded.strength,
                "short_description": stmt.excluded.short_description,
                "dosage_summary": stmt.excluded.dosage_summary,
                "pediatric_dose_mg_per_kg_min": stmt.excluded.pediatric_dose_mg_per_kg_min,
                "pediatric_dose_mg_per_kg_max": stmt.excluded.pediatric_dose_mg_per_kg_max,
                "pediatric_dose_note": stmt.excluded.pediatric_dose_note,
                "default_opened_shelf_days": stmt.excluded.default_opened_shelf_days,
                "is_otc": stmt.excluded.is_otc,
                "is_home_cabinet_relevant": stmt.excluded.is_home_cabinet_relevant,
                "search_rank": stmt.excluded.search_rank,
            },
        )
        await session.execute(stmt)
        await session.commit()

    await engine.dispose()
    print(f"Seeded {len(rows)} curated catalog rows from {len(seed_paths)} seed file(s)")


if __name__ == "__main__":
    asyncio.run(main())
