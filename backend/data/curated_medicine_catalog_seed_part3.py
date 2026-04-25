"""Дополнительный curated seed: доводим каталог до ~300 пар ru/en."""

from __future__ import annotations

SEED_DATA: list[dict[str, object]] = []


def add_pair(
    *,
    key: str,
    ru_name: str,
    en_name: str,
    ru_active: str,
    en_active: str,
    ru_form: str,
    en_form: str,
    ru_strength: str | None,
    en_strength: str | None,
    ru_desc: str,
    en_desc: str,
    otc: bool,
    rank: int,
) -> None:
    SEED_DATA.extend(
        [
            {
                "key": key,
                "language": "ru",
                "display_name": ru_name,
                "active_substance": ru_active,
                "form": ru_form,
                "strength": ru_strength,
                "short_description": ru_desc,
                "is_otc": otc,
                "search_rank": rank,
            },
            {
                "key": key,
                "language": "en",
                "display_name": en_name,
                "active_substance": en_active,
                "form": en_form,
                "strength": en_strength,
                "short_description": en_desc,
                "is_otc": otc,
                "search_rank": rank,
            },
        ]
    )


def add_variants(
    *,
    base_key: str,
    ru_name: str,
    en_name: str,
    ru_active: str,
    en_active: str,
    variants: list[tuple[str, str, str, str | None, str | None, int]],
    ru_desc: str,
    en_desc: str,
    otc: bool,
) -> None:
    for suffix, ru_form, en_form, ru_strength, en_strength, rank in variants:
        add_pair(
            key=f"{base_key}_{suffix}",
            ru_name=ru_name,
            en_name=en_name,
            ru_active=ru_active,
            en_active=en_active,
            ru_form=ru_form,
            en_form=en_form,
            ru_strength=ru_strength,
            en_strength=en_strength,
            ru_desc=ru_desc,
            en_desc=en_desc,
            otc=otc,
            rank=rank,
        )


# Allergy / ENT
add_variants(
    base_key="levocetirizine",
    ru_name="Левоцетиризин",
    en_name="Levocetirizine",
    ru_active="Левоцетиризин",
    en_active="Levocetirizine",
    variants=[
        ("tablets", "таблетки", "tablets", "5 мг", "5 mg", 60),
        ("solution", "раствор", "solution", "2.5 мг/5 мл", "2.5 mg/5 mL", 55),
    ],
    ru_desc="Неседативный антигистаминный препарат при аллергии и крапивнице.",
    en_desc="Non-drowsy antihistamine for allergy symptoms and hives.",
    otc=True,
)
add_variants(
    base_key="desloratadine",
    ru_name="Дезлоратадин",
    en_name="Desloratadine",
    ru_active="Дезлоратадин",
    en_active="Desloratadine",
    variants=[
        ("tablets", "таблетки", "tablets", "5 мг", "5 mg", 58),
        ("solution", "раствор", "solution", "0.5 мг/мл", "0.5 mg/mL", 54),
        ("odt", "таблетки диспергируемые", "orally disintegrating tablets", "2.5 мг", "2.5 mg", 50),
    ],
    ru_desc="Антигистаминный препарат при сезонной и круглогодичной аллергии.",
    en_desc="Antihistamine for seasonal and perennial allergy symptoms.",
    otc=False,
)
add_variants(
    base_key="fexofenadine",
    ru_name="Фексофенадин",
    en_name="Fexofenadine",
    ru_active="Фексофенадин",
    en_active="Fexofenadine",
    variants=[
        ("tablets_120", "таблетки", "tablets", "120 мг", "120 mg", 57),
        ("tablets_180", "таблетки", "tablets", "180 мг", "180 mg", 55),
        ("suspension", "суспензия", "suspension", "30 мг/5 мл", "30 mg/5 mL", 52),
        ("odt", "таблетки диспергируемые", "orally dissolving tablets", "30 мг", "30 mg", 48),
    ],
    ru_desc="Антигистаминный препарат при аллергическом насморке и зуде.",
    en_desc="Antihistamine for allergic rhinitis and itching.",
    otc=True,
)
add_variants(
    base_key="chlorpheniramine",
    ru_name="Хлорфенирамин",
    en_name="Chlorpheniramine",
    ru_active="Хлорфенирамин",
    en_active="Chlorpheniramine",
    variants=[
        ("tablets", "таблетки", "tablets", "4 мг", "4 mg", 46),
        ("syrup", "сироп", "liquid", "2 мг/5 мл", "2 mg/5 mL", 42),
        ("er_capsules", "капсулы пролонгированного действия", "extended-release capsules", "8 мг", "8 mg", 38),
    ],
    ru_desc="Классический антигистаминный препарат, может вызывать сонливость.",
    en_desc="Classic antihistamine that may cause drowsiness.",
    otc=True,
)
add_variants(
    base_key="cetirizine_extra",
    ru_name="Цетиризин",
    en_name="Cetirizine",
    ru_active="Цетиризин",
    en_active="Cetirizine",
    variants=[
        ("odt", "таблетки диспергируемые", "orally disintegrating tablets", "10 мг", "10 mg", 56),
        ("capsules", "капсулы", "capsules", "10 мг", "10 mg", 45),
    ],
    ru_desc="Дополнительные домашние формы цетиризина при аллергии.",
    en_desc="Additional home-use cetirizine forms for allergy symptoms.",
    otc=True,
)
add_variants(
    base_key="loratadine_extra",
    ru_name="Лоратадин",
    en_name="Loratadine",
    ru_active="Лоратадин",
    en_active="Loratadine",
    variants=[
        ("capsules", "капсулы", "capsules", "10 мг", "10 mg", 44),
        ("odt", "таблетки диспергируемые", "rapidly disintegrating tablets", "10 мг", "10 mg", 43),
    ],
    ru_desc="Дополнительные формы лоратадина при сезонной аллергии.",
    en_desc="Additional loratadine forms for seasonal allergy relief.",
    otc=True,
)
add_pair(
    key="cetirizine_pseudoephedrine_tablets",
    ru_name="Цетиризин/псевдоэфедрин",
    en_name="Cetirizine/Pseudoephedrine",
    ru_active="Цетиризин + псевдоэфедрин",
    en_active="Cetirizine + pseudoephedrine",
    ru_form="таблетки пролонгированного действия",
    en_form="extended-release tablets",
    ru_strength="5/120 мг",
    en_strength="5/120 mg",
    ru_desc="Комбинированный препарат от аллергии с заложенностью носа.",
    en_desc="Combination allergy medicine with decongestant effect.",
    otc=False,
    rank=44,
)
add_pair(
    key="loratadine_pseudoephedrine_tablets",
    ru_name="Лоратадин/псевдоэфедрин",
    en_name="Loratadine/Pseudoephedrine",
    ru_active="Лоратадин + псевдоэфедрин",
    en_active="Loratadine + pseudoephedrine",
    ru_form="таблетки пролонгированного действия",
    en_form="extended-release tablets",
    ru_strength="5/120 мг",
    en_strength="5/120 mg",
    ru_desc="Комбинированный препарат при аллергии и выраженной заложенности носа.",
    en_desc="Combination medicine for allergy with marked nasal congestion.",
    otc=False,
    rank=43,
)
add_variants(
    base_key="pseudoephedrine_extra",
    ru_name="Псевдоэфедрин",
    en_name="Pseudoephedrine",
    ru_active="Псевдоэфедрин",
    en_active="Pseudoephedrine",
    variants=[
        ("er_12h", "таблетки пролонгированного действия", "12-hour extended-release tablets", "120 мг", "120 mg", 47),
        ("er_24h", "таблетки пролонгированного действия", "24-hour extended-release tablets", "240 мг", "240 mg", 45),
    ],
    ru_desc="Пероральный деконгестант для кратковременного облегчения заложенности носа.",
    en_desc="Oral decongestant for short-term relief of nasal congestion.",
    otc=True,
)
add_pair(
    key="oxymetazoline_child_nasal_spray",
    ru_name="Оксиметазолин детский",
    en_name="Children's Oxymetazoline",
    ru_active="Оксиметазолин",
    en_active="Oxymetazoline",
    ru_form="спрей назальный",
    en_form="nasal spray",
    ru_strength="0.025%",
    en_strength="0.025%",
    ru_desc="Короткий курс при заложенности носа у детей старше 6 лет.",
    en_desc="Short-course nasal decongestant for children over 6 years.",
    otc=True,
    rank=49,
)
add_pair(
    key="saline_rinse_packets",
    ru_name="Пакеты для солевого промывания носа",
    en_name="Saline Nasal Rinse Packets",
    ru_active="Соль + буфер",
    en_active="Salt + buffer",
    ru_form="пакеты для промывания",
    en_form="rinse packets",
    ru_strength=None,
    en_strength=None,
    ru_desc="Для домашнего промывания носа при аллергии и насморке.",
    en_desc="For home nasal rinsing during allergies and colds.",
    otc=True,
    rank=40,
)

# Respiratory / asthma
add_variants(
    base_key="albuterol",
    ru_name="Альбутерол",
    en_name="Albuterol",
    ru_active="Альбутерол",
    en_active="Albuterol",
    variants=[
        ("hfa", "ингалятор", "inhaler", "90 мкг/доза", "90 mcg/puff", 60),
        ("neb_solution", "раствор для небулайзера", "nebulizer solution", "2.5 мг/3 мл", "2.5 mg/3 mL", 58),
    ],
    ru_desc="Бронходилататор для быстрого облегчения свистящего дыхания и приступов астмы.",
    en_desc="Rescue bronchodilator for wheezing and asthma symptoms.",
    otc=False,
)
add_variants(
    base_key="levalbuterol",
    ru_name="Левальбутерол",
    en_name="Levalbuterol",
    ru_active="Левальбутерол",
    en_active="Levalbuterol",
    variants=[
        ("hfa", "ингалятор", "inhaler", "45 мкг/доза", "45 mcg/puff", 46),
        ("neb_solution", "раствор для небулайзера", "nebulizer solution", "0.63 мг/3 мл", "0.63 mg/3 mL", 44),
    ],
    ru_desc="Бронходилататор для облегчения бронхоспазма.",
    en_desc="Bronchodilator for relief of bronchospasm.",
    otc=False,
)
add_variants(
    base_key="budesonide_inhalation",
    ru_name="Будесонид ингаляционный",
    en_name="Budesonide Inhalation",
    ru_active="Будесонид",
    en_active="Budesonide",
    variants=[
        ("inhaler", "ингалятор", "inhaler", "180 мкг/доза", "180 mcg/puff", 48),
        ("neb_suspension", "суспензия для небулайзера", "nebulizer suspension", "0.5 мг/2 мл", "0.5 mg/2 mL", 50),
    ],
    ru_desc="Ингаляционный стероид для контроля астмы.",
    en_desc="Inhaled steroid for asthma control.",
    otc=False,
)
add_pair(
    key="budesonide_albuterol_inhaler",
    ru_name="Будесонид/альбутерол",
    en_name="Budesonide/Albuterol",
    ru_active="Будесонид + альбутерол",
    en_active="Budesonide + albuterol",
    ru_form="ингалятор",
    en_form="inhaler",
    ru_strength=None,
    en_strength=None,
    ru_desc="Комбинированный ингалятор для предотвращения и облегчения симптомов астмы у взрослых.",
    en_desc="Combination inhaler to prevent and relieve asthma symptoms in adults.",
    otc=False,
    rank=42,
)
add_variants(
    base_key="albuterol_ipratropium",
    ru_name="Альбутерол/ипратропий",
    en_name="Albuterol/Ipratropium",
    ru_active="Альбутерол + ипратропий",
    en_active="Albuterol + ipratropium",
    variants=[
        ("inhaler", "ингалятор", "inhaler", None, None, 40),
        ("neb_solution", "раствор для небулайзера", "nebulizer solution", None, None, 38),
    ],
    ru_desc="Комбинированный бронходилататор при хронической обструкции и бронхоспазме.",
    en_desc="Combination bronchodilator for obstructive airway symptoms.",
    otc=False,
)
add_pair(
    key="acetylcysteine_inhalation_solution",
    ru_name="Ацетилцистеин ингаляционный",
    en_name="Acetylcysteine Inhalation",
    ru_active="Ацетилцистеин",
    en_active="Acetylcysteine",
    ru_form="раствор для небулайзера",
    en_form="nebulizer solution",
    ru_strength="10–20%",
    en_strength="10-20%",
    ru_desc="Муколитик для разжижения густой мокроты по назначению врача.",
    en_desc="Mucolytic for thick secretions when prescribed.",
    otc=False,
    rank=36,
)
add_variants(
    base_key="montelukast",
    ru_name="Монтелукаст",
    en_name="Montelukast",
    ru_active="Монтелукаст",
    en_active="Montelukast",
    variants=[
        ("tablets", "таблетки", "tablets", "10 мг", "10 mg", 46),
        ("chewable", "жевательные таблетки", "chewable tablets", "4–5 мг", "4-5 mg", 48),
        ("granules", "гранулы", "granules", "4 мг", "4 mg", 44),
    ],
    ru_desc="Средство для контроля астмы и аллергического ринита; рецептурное.",
    en_desc="Prescription medicine for asthma control and allergic rhinitis.",
    otc=False,
)
add_variants(
    base_key="prednisolone",
    ru_name="Преднизолон",
    en_name="Prednisolone",
    ru_active="Преднизолон",
    en_active="Prednisolone",
    variants=[
        ("tablets", "таблетки", "tablets", "5 мг", "5 mg", 37),
        ("solution", "раствор", "solution", "15 мг/5 мл", "15 mg/5 mL", 39),
        ("odt", "таблетки диспергируемые", "orally disintegrating tablets", "15 мг", "15 mg", 35),
    ],
    ru_desc="Стероидное противовоспалительное средство, только по назначению врача.",
    en_desc="Steroid anti-inflammatory medicine, prescription only.",
    otc=False,
)
add_variants(
    base_key="dextromethorphan_extra",
    ru_name="Декстрометорфан",
    en_name="Dextromethorphan",
    ru_active="Декстрометорфан",
    en_active="Dextromethorphan",
    variants=[
        ("lozenges", "леденцы", "lozenges", None, None, 43),
        ("strips", "растворимые полоски", "dissolving strips", None, None, 41),
    ],
    ru_desc="Дополнительные формы для временного облегчения сухого кашля.",
    en_desc="Additional forms for temporary relief of dry cough.",
    otc=True,
)
add_variants(
    base_key="guaifenesin_extra",
    ru_name="Гвайфенезин",
    en_name="Guaifenesin",
    ru_active="Гвайфенезин",
    en_active="Guaifenesin",
    variants=[
        ("er_tablets", "таблетки пролонгированного действия", "extended-release tablets", "600 мг", "600 mg", 42),
        ("granules", "гранулы", "granules", None, None, 38),
    ],
    ru_desc="Отхаркивающее средство для разжижения мокроты.",
    en_desc="Expectorant to thin mucus and ease chest congestion.",
    otc=True,
)

# GI
add_variants(
    base_key="psyllium",
    ru_name="Псиллиум",
    en_name="Psyllium",
    ru_active="Псиллиум",
    en_active="Psyllium",
    variants=[
        ("powder", "порошок", "powder", None, None, 46),
        ("capsules", "капсулы", "capsules", None, None, 42),
        ("wafers", "вафли", "wafers", None, None, 38),
    ],
    ru_desc="Объёмное слабительное при запоре.",
    en_desc="Bulk-forming laxative for constipation.",
    otc=True,
)
add_variants(
    base_key="docusate",
    ru_name="Докузат натрия",
    en_name="Docusate Sodium",
    ru_active="Докузат натрия",
    en_active="Docusate sodium",
    variants=[
        ("capsules", "капсулы", "capsules", "100 мг", "100 mg", 38),
        ("liquid", "жидкость", "liquid", "50 мг/5 мл", "50 mg/5 mL", 36),
    ],
    ru_desc="Смягчитель стула для кратковременного применения при запоре.",
    en_desc="Stool softener for short-term constipation relief.",
    otc=True,
)
add_variants(
    base_key="glycerin_suppositories",
    ru_name="Глицериновые суппозитории",
    en_name="Glycerin Suppositories",
    ru_active="Глицерин",
    en_active="Glycerin",
    variants=[
        ("adult", "суппозитории", "suppositories", "взрослые", "adult", 34),
        ("child", "суппозитории", "suppositories", "детские", "child", 34),
    ],
    ru_desc="Ректальное средство для быстрого облегчения запора.",
    en_desc="Rectal product for quick constipation relief.",
    otc=True,
)
add_pair(
    key="bismuth_subsalicylate_liquid",
    ru_name="Висмута субсалицилат жидкость",
    en_name="Bismuth Subsalicylate Liquid",
    ru_active="Висмута субсалицилат",
    en_active="Bismuth subsalicylate",
    ru_form="жидкость",
    en_form="liquid",
    ru_strength="262 мг/15 мл",
    en_strength="262 mg/15 mL",
    ru_desc="Жидкая форма при расстройстве желудка, диарее и изжоге.",
    en_desc="Liquid form for upset stomach, diarrhea, and heartburn.",
    otc=True,
    rank=40,
)
add_pair(
    key="simethicone_infant_drops",
    ru_name="Симетикон детские капли",
    en_name="Infant Simethicone Drops",
    ru_active="Симетикон",
    en_active="Simethicone",
    ru_form="капли",
    en_form="drops",
    ru_strength="20 мг/0.3 мл",
    en_strength="20 mg/0.3 mL",
    ru_desc="Для младенческого вздутия и газообразования.",
    en_desc="For infant gas and bloating.",
    otc=True,
    rank=43,
)
add_pair(
    key="loperamide_solution",
    ru_name="Лоперамид раствор",
    en_name="Loperamide Solution",
    ru_active="Лоперамид",
    en_active="Loperamide",
    ru_form="раствор",
    en_form="solution",
    ru_strength="1 мг/5 мл",
    en_strength="1 mg/5 mL",
    ru_desc="Жидкая форма для диареи у старших детей и взрослых.",
    en_desc="Liquid form for diarrhea in older children and adults.",
    otc=True,
    rank=35,
)
add_variants(
    base_key="omeprazole_extra",
    ru_name="Омепразол",
    en_name="Omeprazole",
    ru_active="Омепразол",
    en_active="Omeprazole",
    variants=[
        ("capsules", "капсулы", "capsules", "20 мг", "20 mg", 42),
        ("granules", "гранулы для суспензии", "granules for suspension", "10 мг", "10 mg", 36),
    ],
    ru_desc="Для частой изжоги и кислотозависимых симптомов.",
    en_desc="For frequent heartburn and acid-related symptoms.",
    otc=True,
)
add_variants(
    base_key="famotidine_extra",
    ru_name="Фамотидин",
    en_name="Famotidine",
    ru_active="Фамотидин",
    en_active="Famotidine",
    variants=[
        ("tablets_10", "таблетки", "tablets", "10 мг", "10 mg", 36),
        ("liquid", "жидкость", "liquid", "40 мг/5 мл", "40 mg/5 mL", 34),
    ],
    ru_desc="Для изжоги, кислой отрыжки и кислотного дискомфорта.",
    en_desc="For heartburn, acid indigestion, and sour stomach.",
    otc=True,
)
add_variants(
    base_key="sodium_bicarbonate_extra",
    ru_name="Натрия бикарбонат",
    en_name="Sodium Bicarbonate",
    ru_active="Натрия бикарбонат",
    en_active="Sodium bicarbonate",
    variants=[
        ("tablets", "шипучие таблетки", "effervescent tablets", "650 мг", "650 mg", 30),
        ("powder", "порошок", "powder", None, None, 28),
    ],
    ru_desc="Антацид для временного облегчения изжоги.",
    en_desc="Antacid for short-term heartburn relief.",
    otc=True,
)
add_variants(
    base_key="bisacodyl_extra",
    ru_name="Бисакодил",
    en_name="Bisacodyl",
    ru_active="Бисакодил",
    en_active="Bisacodyl",
    variants=[
        ("tablets", "таблетки кишечнорастворимые", "delayed-release tablets", "5 мг", "5 mg", 36),
        ("suppositories", "суппозитории", "suppositories", "10 мг", "10 mg", 34),
    ],
    ru_desc="Стимулирующее слабительное для кратковременного применения.",
    en_desc="Stimulant laxative for short-term use.",
    otc=True,
)
add_variants(
    base_key="senna_extra",
    ru_name="Сенна",
    en_name="Senna",
    ru_active="Сенна",
    en_active="Senna",
    variants=[
        ("tablets", "жевательные таблетки", "chewable tablets", None, None, 33),
        ("liquid", "жидкость", "liquid", None, None, 31),
    ],
    ru_desc="Растительное стимулирующее слабительное.",
    en_desc="Herbal stimulant laxative.",
    otc=True,
)
add_variants(
    base_key="dimenhydrinate_extra",
    ru_name="Дименгидринат",
    en_name="Dimenhydrinate",
    ru_active="Дименгидринат",
    en_active="Dimenhydrinate",
    variants=[
        ("tablets", "капсулы", "capsules", "50 мг", "50 mg", 35),
        ("chewable", "жевательные таблетки", "chewable tablets", "50 мг", "50 mg", 33),
    ],
    ru_desc="При укачивании, тошноте и рвоте в дороге.",
    en_desc="For motion sickness, nausea, and vomiting during travel.",
    otc=True,
)
add_variants(
    base_key="meclizine_extra",
    ru_name="Меклизин",
    en_name="Meclizine",
    ru_active="Меклизин",
    en_active="Meclizine",
    variants=[
        ("tablets", "капсулы", "capsules", "25 мг", "25 mg", 31),
        ("chewable", "жевательные таблетки", "chewable tablets", "25 мг", "25 mg", 29),
    ],
    ru_desc="От укачивания и головокружения.",
    en_desc="For motion sickness and dizziness.",
    otc=True,
)
add_variants(
    base_key="ondansetron_extra",
    ru_name="Ондансетрон",
    en_name="Ondansetron",
    ru_active="Ондансетрон",
    en_active="Ondansetron",
    variants=[
        ("odt", "таблетки диспергируемые", "orally disintegrating tablets", "4 мг", "4 mg", 33),
        ("solution", "раствор", "solution", "4 мг/5 мл", "4 mg/5 mL", 31),
    ],
    ru_desc="Рецептурное средство от тошноты и рвоты.",
    en_desc="Prescription medicine for nausea and vomiting.",
    otc=False,
)

# Skin / first aid
add_variants(
    base_key="ketoconazole",
    ru_name="Кетоконазол",
    en_name="Ketoconazole",
    ru_active="Кетоконазол",
    en_active="Ketoconazole",
    variants=[
        ("cream", "крем", "cream", "2%", "2%", 46),
        ("shampoo", "шампунь", "shampoo", "2%", "2%", 44),
    ],
    ru_desc="Противогрибковое средство для кожи или кожи головы.",
    en_desc="Antifungal treatment for skin or scalp conditions.",
    otc=True,
)
add_variants(
    base_key="selenium_sulfide",
    ru_name="Селен сульфид",
    en_name="Selenium Sulfide",
    ru_active="Селен сульфид",
    en_active="Selenium sulfide",
    variants=[
        ("shampoo", "шампунь", "shampoo", "1%", "1%", 41),
        ("lotion", "лосьон", "lotion", "2.5%", "2.5%", 37),
    ],
    ru_desc="Для перхоти, себореи и некоторых грибковых поражений кожи.",
    en_desc="For dandruff, seborrhea, and some fungal skin conditions.",
    otc=True,
)
add_variants(
    base_key="nystatin_topical",
    ru_name="Нистатин наружный",
    en_name="Topical Nystatin",
    ru_active="Нистатин",
    en_active="Nystatin",
    variants=[
        ("cream", "крем", "cream", None, None, 39),
        ("ointment", "мазь", "ointment", None, None, 37),
        ("powder", "порошок", "powder", None, None, 35),
    ],
    ru_desc="Противогрибковое средство для кожи.",
    en_desc="Antifungal treatment for skin infections.",
    otc=False,
)
add_variants(
    base_key="nystatin_oral",
    ru_name="Нистатин внутрь",
    en_name="Oral Nystatin",
    ru_active="Нистатин",
    en_active="Nystatin",
    variants=[
        ("suspension", "суспензия", "suspension", None, None, 34),
        ("tablets", "таблетки", "tablets", None, None, 32),
    ],
    ru_desc="Для грибковых поражений слизистой и пищеварительного тракта.",
    en_desc="For fungal infections of the mouth and digestive tract.",
    otc=False,
)
add_variants(
    base_key="pramoxine",
    ru_name="Прамоксин",
    en_name="Pramoxine",
    ru_active="Прамоксин",
    en_active="Pramoxine",
    variants=[
        ("gel", "гель", "gel", None, None, 33),
        ("lotion", "лосьон", "lotion", None, None, 31),
        ("spray", "спрей", "spray", None, None, 29),
    ],
    ru_desc="Местное средство для временного уменьшения зуда и боли кожи.",
    en_desc="Topical product for temporary relief of itching and minor skin pain.",
    otc=True,
)
add_variants(
    base_key="hydrocortisone_extra",
    ru_name="Гидрокортизон",
    en_name="Hydrocortisone",
    ru_active="Гидрокортизон",
    en_active="Hydrocortisone",
    variants=[
        ("ointment", "мазь", "ointment", "1%", "1%", 34),
        ("lotion", "лосьон", "lotion", "1%", "1%", 32),
    ],
    ru_desc="От воспаления, зуда и раздражения кожи.",
    en_desc="For skin inflammation, itch, and irritation.",
    otc=True,
)
add_variants(
    base_key="mupirocin_extra",
    ru_name="Мупироцин",
    en_name="Mupirocin",
    ru_active="Мупироцин",
    en_active="Mupirocin",
    variants=[
        ("ointment", "мазь", "ointment", "2%", "2%", 34),
        ("cream", "крем", "cream", "2%", "2%", 32),
    ],
    ru_desc="Рецептурное средство при бактериальной инфекции кожи.",
    en_desc="Prescription treatment for bacterial skin infection.",
    otc=False,
)
add_variants(
    base_key="neomycin_extra",
    ru_name="Неомицин",
    en_name="Neomycin",
    ru_active="Неомицин",
    en_active="Neomycin",
    variants=[
        ("ointment", "мазь", "ointment", None, None, 31),
        ("cream", "крем", "cream", None, None, 29),
    ],
    ru_desc="Наружный антибиотик для поверхностных бактериальных поражений кожи.",
    en_desc="Topical antibiotic for superficial bacterial skin infection.",
    otc=True,
)
add_variants(
    base_key="diphenhydramine_topical_extra",
    ru_name="Дифенгидрамин наружный",
    en_name="Topical Diphenhydramine",
    ru_active="Дифенгидрамин",
    en_active="Diphenhydramine",
    variants=[
        ("gel", "гель", "gel", None, None, 31),
        ("spray", "спрей", "spray", None, None, 28),
    ],
    ru_desc="Для уменьшения зуда при укусе насекомых и раздражении кожи.",
    en_desc="For itch relief after bites and mild skin irritation.",
    otc=True,
)
add_variants(
    base_key="benzoyl_peroxide_extra",
    ru_name="Бензоил пероксид",
    en_name="Benzoyl Peroxide",
    ru_active="Бензоил пероксид",
    en_active="Benzoyl peroxide",
    variants=[
        ("gel", "гель", "gel", "2.5%", "2.5%", 30),
        ("wash", "очищающий гель", "wash", "5%", "5%", 28),
    ],
    ru_desc="Для лечения лёгкой и умеренной акне.",
    en_desc="For treatment of mild to moderate acne.",
    otc=True,
)
add_pair(
    key="acyclovir_topical_cream",
    ru_name="Ацикловир крем",
    en_name="Acyclovir Cream",
    ru_active="Ацикловир",
    en_active="Acyclovir",
    ru_form="крем",
    en_form="cream",
    ru_strength="5%",
    en_strength="5%",
    ru_desc="Наружное средство при герпесе на губах.",
    en_desc="Topical treatment for cold sores on the lips.",
    otc=False,
    rank=30,
)

# Ophthalmology / ear
add_variants(
    base_key="polymyxin_trimethoprim_oph",
    ru_name="Полимиксин B/триметоприм офтальмологический",
    en_name="Polymyxin B/Trimethoprim Ophthalmic",
    ru_active="Полимиксин B + триметоприм",
    en_active="Polymyxin B + trimethoprim",
    variants=[("drops", "глазные капли", "eye drops", None, None, 40)],
    ru_desc="Рецептурные капли при бактериальной инфекции глаза.",
    en_desc="Prescription drops for bacterial eye infection.",
    otc=False,
)
add_variants(
    base_key="erythromycin_oph",
    ru_name="Эритромицин офтальмологический",
    en_name="Erythromycin Ophthalmic",
    ru_active="Эритромицин",
    en_active="Erythromycin",
    variants=[("ointment", "глазная мазь", "eye ointment", "0.5%", "0.5%", 39)],
    ru_desc="Рецептурная глазная мазь при бактериальной инфекции.",
    en_desc="Prescription eye ointment for bacterial infection.",
    otc=False,
)
add_variants(
    base_key="bacitracin_oph",
    ru_name="Бацитрацин офтальмологический",
    en_name="Bacitracin Ophthalmic",
    ru_active="Бацитрацин",
    en_active="Bacitracin",
    variants=[("ointment", "глазная мазь", "eye ointment", None, None, 34)],
    ru_desc="Рецептурная офтальмологическая мазь при бактериальной инфекции.",
    en_desc="Prescription ophthalmic ointment for bacterial infection.",
    otc=False,
)
add_variants(
    base_key="neomycin_polymyxin_bacitracin_oph",
    ru_name="Неомицин/полимиксин/бацитрацин офтальмологический",
    en_name="Neomycin/Polymyxin/Bacitracin Ophthalmic",
    ru_active="Неомицин + полимиксин + бацитрацин",
    en_active="Neomycin + polymyxin + bacitracin",
    variants=[("ointment", "глазная мазь", "eye ointment", None, None, 33)],
    ru_desc="Комбинированная рецептурная мазь для инфекции глаза и век.",
    en_desc="Combination prescription ointment for eye and eyelid infection.",
    otc=False,
)
add_variants(
    base_key="neomycin_polymyxin_bacitracin_hydrocortisone_oph",
    ru_name="Неомицин/полимиксин/бацитрацин/гидрокортизон офтальмологический",
    en_name="Neomycin/Polymyxin/Bacitracin/Hydrocortisone Ophthalmic",
    ru_active="Неомицин + полимиксин + бацитрацин + гидрокортизон",
    en_active="Neomycin + polymyxin + bacitracin + hydrocortisone",
    variants=[
        ("ointment", "офтальмологический гель", "ophthalmic gel", None, None, 31),
        ("suspension", "глазная суспензия", "ophthalmic suspension", None, None, 29),
    ],
    ru_desc="Комбинированное рецептурное средство при инфекции и воспалении глаза.",
    en_desc="Combination prescription treatment for eye infection with inflammation.",
    otc=False,
)
add_variants(
    base_key="cromolyn_oph",
    ru_name="Кромолин офтальмологический",
    en_name="Cromolyn Ophthalmic",
    ru_active="Кромолин",
    en_active="Cromolyn",
    variants=[("drops", "глазные капли", "eye drops", "4%", "4%", 32)],
    ru_desc="При аллергическом конъюнктивите и зуде глаз.",
    en_desc="For allergic conjunctivitis and itchy eyes.",
    otc=False,
)
add_variants(
    base_key="epinastine_oph",
    ru_name="Эпинастин офтальмологический",
    en_name="Epinastine Ophthalmic",
    ru_active="Эпинастин",
    en_active="Epinastine",
    variants=[("drops", "глазные капли", "eye drops", "0.05%", "0.05%", 30)],
    ru_desc="Антигистаминные глазные капли при аллергическом зуде.",
    en_desc="Antihistamine eye drops for allergic itchy eyes.",
    otc=False,
)
add_variants(
    base_key="bepotastine_oph",
    ru_name="Бепотастин офтальмологический",
    en_name="Bepotastine Ophthalmic",
    ru_active="Бепотастин",
    en_active="Bepotastine",
    variants=[("drops", "глазные капли", "eye drops", "1.5%", "1.5%", 28)],
    ru_desc="При аллергическом зуде и раздражении глаз.",
    en_desc="For allergic itching and irritation of the eyes.",
    otc=False,
)
add_variants(
    base_key="ofloxacin_otic_extra",
    ru_name="Офлоксацин ушной",
    en_name="Ofloxacin Otic",
    ru_active="Офлоксацин",
    en_active="Ofloxacin",
    variants=[("drops", "ушные капли", "ear drops", "0.3%", "0.3%", 31)],
    ru_desc="Рецептурные капли при бактериальной инфекции уха.",
    en_desc="Prescription drops for bacterial ear infection.",
    otc=False,
)
add_variants(
    base_key="cipro_dexa_otic_extra",
    ru_name="Ципрофлоксацин/дексаметазон ушной",
    en_name="Ciprofloxacin/Dexamethasone Otic",
    ru_active="Ципрофлоксацин + дексаметазон",
    en_active="Ciprofloxacin + dexamethasone",
    variants=[("drops", "ушные капли", "ear drops", "0.3%/0.1%", "0.3%/0.1%", 30)],
    ru_desc="Рецептурные капли для инфекции уха с воспалением.",
    en_desc="Prescription ear drops for infection with inflammation.",
    otc=False,
)
add_variants(
    base_key="antipyrine_benzocaine_otic_extra",
    ru_name="Антипирин/бензокаин ушной",
    en_name="Antipyrine/Benzocaine Otic",
    ru_active="Антипирин + бензокаин",
    en_active="Antipyrine + benzocaine",
    variants=[("drops", "ушные капли", "ear drops", None, None, 27)],
    ru_desc="Для временного уменьшения боли и дискомфорта в ухе.",
    en_desc="For temporary relief of ear pain and discomfort.",
    otc=False,
)

# Antibiotics / antivirals
add_variants(
    base_key="cephalexin",
    ru_name="Цефалексин",
    en_name="Cephalexin",
    ru_active="Цефалексин",
    en_active="Cephalexin",
    variants=[
        ("capsules", "капсулы", "capsules", "500 мг", "500 mg", 34),
        ("suspension", "суспензия", "suspension", "250 мг/5 мл", "250 mg/5 mL", 34),
    ],
    ru_desc="Рецептурный антибиотик для бактериальных инфекций кожи и ЛОР-органов.",
    en_desc="Prescription antibiotic for bacterial skin and ENT infections.",
    otc=False,
)
add_variants(
    base_key="trimethoprim_sulfamethoxazole",
    ru_name="Триметоприм/сульфаметоксазол",
    en_name="Trimethoprim/Sulfamethoxazole",
    ru_active="Триметоприм + сульфаметоксазол",
    en_active="Trimethoprim + sulfamethoxazole",
    variants=[
        ("tablets", "таблетки", "tablets", "160/800 мг", "160/800 mg", 32),
        ("suspension", "суспензия", "suspension", "40/200 мг/5 мл", "40/200 mg/5 mL", 32),
    ],
    ru_desc="Комбинированный рецептурный антибиотик.",
    en_desc="Combination prescription antibiotic.",
    otc=False,
)
add_variants(
    base_key="nitrofurantoin",
    ru_name="Нитрофурантоин",
    en_name="Nitrofurantoin",
    ru_active="Нитрофурантоин",
    en_active="Nitrofurantoin",
    variants=[
        ("capsules", "капсулы", "capsules", "100 мг", "100 mg", 28),
        ("suspension", "суспензия", "suspension", "25 мг/5 мл", "25 mg/5 mL", 28),
    ],
    ru_desc="Рецептурный антибиотик, часто используемый при инфекциях мочевых путей.",
    en_desc="Prescription antibiotic often used for urinary tract infections.",
    otc=False,
)
add_variants(
    base_key="erythromycin_extra",
    ru_name="Эритромицин",
    en_name="Erythromycin",
    ru_active="Эритромицин",
    en_active="Erythromycin",
    variants=[
        ("tablets", "капсулы", "capsules", "250 мг", "250 mg", 31),
        ("suspension", "суспензия", "suspension", "200 мг/5 мл", "200 mg/5 mL", 31),
    ],
    ru_desc="Рецептурный макролидный антибиотик.",
    en_desc="Prescription macrolide antibiotic.",
    otc=False,
)
add_variants(
    base_key="acyclovir_oral",
    ru_name="Ацикловир",
    en_name="Acyclovir",
    ru_active="Ацикловир",
    en_active="Acyclovir",
    variants=[
        ("tablets", "таблетки", "tablets", "400 мг", "400 mg", 31),
        ("capsules", "капсулы", "capsules", "200 мг", "200 mg", 29),
        ("suspension", "суспензия", "suspension", "200 мг/5 мл", "200 mg/5 mL", 29),
    ],
    ru_desc="Противовирусное средство при герпетической инфекции.",
    en_desc="Antiviral medicine for herpes infections.",
    otc=False,
)
add_variants(
    base_key="valacyclovir_extra",
    ru_name="Валацикловир",
    en_name="Valacyclovir",
    ru_active="Валацикловир",
    en_active="Valacyclovir",
    variants=[("tablets", "таблетки", "tablets", "500 мг", "500 mg", 30)],
    ru_desc="Противовирусное средство при герпесе и опоясывающем лишае.",
    en_desc="Antiviral medicine for herpes and shingles.",
    otc=False,
)

# Common adult home meds / supplements
add_variants(
    base_key="metformin_extra",
    ru_name="Метформин",
    en_name="Metformin",
    ru_active="Метформин",
    en_active="Metformin",
    variants=[
        ("tablets", "таблетки", "tablets", "500 мг", "500 mg", 28),
        ("xr", "таблетки пролонгированного действия", "extended-release tablets", "500 мг", "500 mg", 26),
    ],
    ru_desc="Часто хранящийся дома рецептурный препарат при сахарном диабете 2 типа.",
    en_desc="Common home prescription medicine for type 2 diabetes.",
    otc=False,
)
add_variants(
    base_key="amlodipine_extra",
    ru_name="Амлодипин",
    en_name="Amlodipine",
    ru_active="Амлодипин",
    en_active="Amlodipine",
    variants=[
        ("tablets", "таблетки", "tablets", "5 мг", "5 mg", 26),
        ("oral_solution", "оральный раствор", "oral solution", "1 мг/мл", "1 mg/mL", 24),
    ],
    ru_desc="Часто встречающийся домашний рецептурный препарат при гипертонии.",
    en_desc="Common home prescription medicine for hypertension.",
    otc=False,
)
add_pair(
    key="losartan_tablets_extra",
    ru_name="Лозартан",
    en_name="Losartan",
    ru_active="Лозартан",
    en_active="Losartan",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="50 мг",
    en_strength="50 mg",
    ru_desc="Домашний рецептурный препарат при гипертонии.",
    en_desc="Home prescription medicine for hypertension.",
    otc=False,
    rank=24,
)
add_pair(
    key="lisinopril_tablets_extra",
    ru_name="Лизиноприл",
    en_name="Lisinopril",
    ru_active="Лизиноприл",
    en_active="Lisinopril",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="10 мг",
    en_strength="10 mg",
    ru_desc="Домашний рецептурный препарат при гипертонии и сердечной недостаточности.",
    en_desc="Home prescription medicine for hypertension and heart failure.",
    otc=False,
    rank=24,
)
add_pair(
    key="bisoprolol_tablets_extra",
    ru_name="Бисопролол",
    en_name="Bisoprolol",
    ru_active="Бисопролол",
    en_active="Bisoprolol",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="5 мг",
    en_strength="5 mg",
    ru_desc="Часто хранящийся дома рецептурный бета-блокатор.",
    en_desc="Common home prescription beta blocker.",
    otc=False,
    rank=23,
)
add_pair(
    key="atorvastatin_tablets_extra",
    ru_name="Аторвастатин",
    en_name="Atorvastatin",
    ru_active="Аторвастатин",
    en_active="Atorvastatin",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="20 мг",
    en_strength="20 mg",
    ru_desc="Часто встречающийся домашний препарат для снижения холестерина.",
    en_desc="Common home medicine used to lower cholesterol.",
    otc=False,
    rank=22,
)
add_pair(
    key="rosuvastatin_tablets_extra",
    ru_name="Розувастатин",
    en_name="Rosuvastatin",
    ru_active="Розувастатин",
    en_active="Rosuvastatin",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="10 мг",
    en_strength="10 mg",
    ru_desc="Домашний рецептурный препарат для контроля холестерина.",
    en_desc="Home prescription medicine for cholesterol control.",
    otc=False,
    rank=22,
)
add_variants(
    base_key="iron_supplement",
    ru_name="Железо",
    en_name="Iron Supplement",
    ru_active="Железо",
    en_active="Iron",
    variants=[
        ("tablets", "таблетки", "tablets", None, None, 23),
        ("liquid", "жидкость", "liquid", None, None, 21),
    ],
    ru_desc="Добавка железа для профилактики и лечения железодефицита по рекомендации врача.",
    en_desc="Iron supplement for prevention or treatment of iron deficiency when advised.",
    otc=True,
)
add_pair(
    key="folic_acid_tablets_extra",
    ru_name="Фолиевая кислота",
    en_name="Folic Acid",
    ru_active="Фолиевая кислота",
    en_active="Folic acid",
    ru_form="таблетки",
    en_form="tablets",
    ru_strength="1 мг",
    en_strength="1 mg",
    ru_desc="Витамин B9 для профилактики и лечения дефицита.",
    en_desc="Vitamin B9 used to prevent or treat deficiency.",
    otc=True,
    rank=23,
)
add_pair(
    key="acyclovir_topical_ointment_extra",
    ru_name="Ацикловир мазь",
    en_name="Acyclovir Ointment",
    ru_active="Ацикловир",
    en_active="Acyclovir",
    ru_form="мазь",
    en_form="ointment",
    ru_strength="5%",
    en_strength="5%",
    ru_desc="Наружная форма против герпетических высыпаний.",
    en_desc="Topical form for herpetic skin eruptions.",
    otc=False,
    rank=28,
)
add_variants(
    base_key="sumatriptan",
    ru_name="Суматриптан",
    en_name="Sumatriptan",
    ru_active="Суматриптан",
    en_active="Sumatriptan",
    variants=[
        ("tablets", "таблетки", "tablets", "50 мг", "50 mg", 24),
        ("nasal_spray", "назальный спрей", "nasal spray", "20 мг/доза", "20 mg/spray", 22),
    ],
    ru_desc="Рецептурное средство для купирования мигрени.",
    en_desc="Prescription medicine for treating migraine attacks.",
    otc=False,
)
add_variants(
    base_key="rizatriptan_extra",
    ru_name="Ризатриптан",
    en_name="Rizatriptan",
    ru_active="Ризатриптан",
    en_active="Rizatriptan",
    variants=[
        ("tablets", "таблетки", "tablets", "10 мг", "10 mg", 22),
        ("odt", "таблетки диспергируемые", "orally disintegrating tablets", "10 мг", "10 mg", 21),
    ],
    ru_desc="Рецептурное средство для лечения приступа мигрени.",
    en_desc="Prescription medicine for treatment of a migraine attack.",
    otc=False,
)
