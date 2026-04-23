import test from "node:test";
import assert from "node:assert/strict";
import { createReminderWithOptionalFirstAdministration } from "../src/client/pages/child-illness/reminderCreation.js";

test("createReminderWithOptionalFirstAdministration logs first administration when already given", async () => {
  const calls: string[] = [];

  const createdPlan = await createReminderWithOptionalFirstAdministration(
    {
      episodeId: "episode-1",
      customMedicineName: "Нурофен",
      doseAmount: "5 мл",
      minIntervalMinutes: 180,
      firstDoseStatus: "already_given",
      firstDoseAt: "2026-04-24T18:10:00+03:00",
    },
    "ru",
    {
      createPlan: async () => {
        calls.push("createPlan");
        return { id: "plan-1" } as any;
      },
      createAdministration: async () => {
        calls.push("createAdministration");
        return { id: "admin-1" } as any;
      },
      rollbackPlan: async () => {
        calls.push("rollbackPlan");
      },
    }
  );

  assert.equal(createdPlan.id, "plan-1");
  assert.deepEqual(calls, ["createPlan", "createAdministration"]);
});

test("createReminderWithOptionalFirstAdministration rolls back plan when first administration fails", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      createReminderWithOptionalFirstAdministration(
        {
          episodeId: "episode-1",
          customMedicineName: "Нурофен",
          doseAmount: "5 мл",
          minIntervalMinutes: 180,
          firstDoseStatus: "already_given",
          firstDoseAt: "2026-04-24T18:10:00+03:00",
        },
        "ru",
        {
          createPlan: async () => {
            calls.push("createPlan");
            return { id: "plan-1" } as any;
          },
          createAdministration: async () => {
            calls.push("createAdministration");
            throw new Error("admin failed");
          },
          rollbackPlan: async () => {
            calls.push("rollbackPlan");
          },
        }
      ),
    (error: any) => {
      assert.match(
        error?.response?.data?.detail ?? "",
        /Не удалось отметить первый приём, поэтому напоминание не было сохранено/
      );
      return true;
    }
  );

  assert.deepEqual(calls, ["createPlan", "createAdministration", "rollbackPlan"]);
});

test("createReminderWithOptionalFirstAdministration reports consistency error when rollback fails", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      createReminderWithOptionalFirstAdministration(
        {
          episodeId: "episode-1",
          customMedicineName: "Нурофен",
          doseAmount: "5 мл",
          minIntervalMinutes: 180,
          firstDoseStatus: "already_given",
          firstDoseAt: "2026-04-24T18:10:00+03:00",
        },
        "ru",
        {
          createPlan: async () => {
            calls.push("createPlan");
            return { id: "plan-1" } as any;
          },
          createAdministration: async () => {
            calls.push("createAdministration");
            throw new Error("admin failed");
          },
          rollbackPlan: async () => {
            calls.push("rollbackPlan");
            throw new Error("rollback failed");
          },
        }
      ),
    (error: any) => {
      assert.match(
        error?.response?.data?.detail ?? "",
        /Не удалось полностью сохранить напоминание/
      );
      return true;
    }
  );

  assert.deepEqual(calls, ["createPlan", "createAdministration", "rollbackPlan"]);
});
