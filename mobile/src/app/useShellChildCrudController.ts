import { useCallback } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import {
  createMobileChild,
  deleteMobileChild,
  updateMobileChild,
  type MobileChildSummary,
} from "../features/children/api/childrenApi";
import { createMobileHeightEntry } from "../features/growth/api/heightEntriesApi";
import { createMobileWeightEntry } from "../features/weight/api/weightEntriesApi";
import type { PillPathActiveScreen } from "./pillPathExpoShellModel";

type ChildCreatePayload = {
  name: string;
  birthDate: string | null;
  avatarKey: string | null;
  gender: string | null;
  babyModeEnabled: boolean;
  weightKg: number | null;
  heightCm: number | null;
  allergies: string | null;
  notes: string | null;
};

type ChildEditPayload = {
  name: string;
  birthDate: string | null;
  avatarKey: string | null;
  gender: string | null;
  babyModeEnabled: boolean;
  allergies: string | null;
  notes: string | null;
};

export function useShellChildCrudController(args: {
  authSession: MobileAuthSession | null;
  selectedChildId: string;
  loadChildren: (
    session: MobileAuthSession,
    options?: { ignoreErrors?: boolean },
  ) => Promise<MobileChildSummary[] | null>;
  setSelectedChildId: (value: string) => void;
  setChildren: (
    value: MobileChildSummary[] | ((current: MobileChildSummary[]) => MobileChildSummary[]),
  ) => void;
  setLatestChildMetricsByCardId: (
    value:
      | Record<string, { weightKg?: number | null; heightCm?: number | null }>
      | ((
          current: Record<
            string,
            { weightKg?: number | null; heightCm?: number | null }
          >,
        ) => Record<string, { weightKg?: number | null; heightCm?: number | null }>),
  ) => void;
  setActiveScreen: (value: PillPathActiveScreen) => void;
}) {
  const handleSubmitChildCreate = useCallback(
    async (payload: ChildCreatePayload) => {
      if (!args.authSession) {
        return;
      }

      const created = await createMobileChild(args.authSession, {
        name: payload.name,
        birthDate: payload.birthDate,
        avatarKey: payload.avatarKey,
        gender: payload.gender,
        babyModeEnabled: payload.babyModeEnabled,
        allergies: payload.allergies,
        notes: payload.notes,
      });

      if (payload.weightKg && payload.weightKg > 0) {
        await createMobileWeightEntry(args.authSession, {
          childId: created.id,
          valueKg: payload.weightKg,
        });
      }

      if (payload.heightCm && payload.heightCm > 0) {
        await createMobileHeightEntry(args.authSession, {
          childId: created.id,
          valueCm: payload.heightCm,
        });
      }

      const nextChildren = await args.loadChildren(args.authSession, {
        ignoreErrors: true,
      });
      args.setSelectedChildId(created.id);

      if (!nextChildren || nextChildren.length === 0) {
        args.setChildren([created]);
        args.setLatestChildMetricsByCardId((current) => ({
          ...current,
          [created.id]: {
            weightKg: payload.weightKg ?? null,
            heightCm: payload.heightCm ?? null,
          },
        }));
      }

      args.setActiveScreen("children");
    },
    [args],
  );

  const handleSubmitChildProfileEdit = useCallback(
    async (payload: ChildEditPayload) => {
      if (!args.authSession || !args.selectedChildId) {
        return;
      }

      await updateMobileChild(args.authSession, args.selectedChildId, {
        name: payload.name,
        birthDate: payload.birthDate,
        avatarKey: payload.avatarKey,
        gender: payload.gender,
        babyModeEnabled: payload.babyModeEnabled,
        allergies: payload.allergies,
        notes: payload.notes,
      });

      await args.loadChildren(args.authSession, { ignoreErrors: true });
      args.setActiveScreen("childProfile");
    },
    [args],
  );

  const handleDeleteSelectedChild = useCallback(async () => {
    if (!args.authSession || !args.selectedChildId) {
      return;
    }

    await deleteMobileChild(args.authSession, args.selectedChildId);
    await args.loadChildren(args.authSession, { ignoreErrors: true });
    args.setActiveScreen("children");
  }, [args]);

  return {
    handleSubmitChildCreate,
    handleSubmitChildProfileEdit,
    handleDeleteSelectedChild,
  };
}
