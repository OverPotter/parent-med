import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalizedMedicineForm,
  getMedicineCatalogCategoryMatch,
  getManualMedicineCategoryOptions,
} from "../src/client/pages/medicine-cabinet/utils.js";

test("temperature and pain category matches common fever medicines", () => {
  assert.equal(
    getMedicineCatalogCategoryMatch(
      {
        name: "Парацетамол",
        form: "таблетки",
        concentration: "500 мг",
        description: "Жаропонижающее и обезболивающее средство",
        dosage: null,
      },
      "temperature_pain"
    ),
    true
  );

  assert.equal(
    getMedicineCatalogCategoryMatch(
      {
        name: "Ибупрофен детский",
        form: "суспензия",
        concentration: "100 мг/5 мл",
        description: "При температуре и боли у детей",
        dosage: null,
      },
      "temperature_pain"
    ),
    true
  );
});

test("manual medicine category options use broad categories", () => {
  const options = getManualMedicineCategoryOptions("ru");
  assert.deepEqual(
    options.map((option) => option.value),
    ["внутрь", "нос", "горло", "глаза", "уши", "кожа", "ингаляция", "другое"]
  );
});

test("localized medicine form translates broad manual categories", () => {
  assert.equal(getLocalizedMedicineForm("нос", "ru"), "Нос");
  assert.equal(getLocalizedMedicineForm("нос", "en"), "Nose");
  assert.equal(getLocalizedMedicineForm("ингаляция", "en"), "Inhalation");
});
