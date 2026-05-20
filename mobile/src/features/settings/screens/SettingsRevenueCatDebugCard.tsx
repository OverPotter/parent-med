import { Pressable, Text, View } from "react-native";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { styles } from "./settingsScreenStyles";
import {
  serializeRevenueCatDebugResult,
  useRevenueCatDebugController,
} from "../model/useRevenueCatDebugController";

type RevenueCatDebugCopy = {
  title: string;
  hint: string;
  sandboxOnly: string;
  openPaywall: string;
  configure: string;
  offerings: string;
  buyMonthly: string;
  buyAnnual: string;
  restore: string;
  snapshot: string;
  resetToFree: string;
  working: string;
  ready: string;
  noResult: string;
  apiKeyPresent: string;
  apiKeyMissing: string;
  entitlement: string;
  syncEnabled: string;
  syncDisabled: string;
  accountMissing: string;
  packageMissing: string;
};

type SettingsRevenueCatDebugCardProps = {
  session: MobileAuthSession | null;
  copy: RevenueCatDebugCopy;
  textPrimaryColor: string;
  textSecondaryColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  onOpenPaywall: () => void;
  onBillingChanged?: () => Promise<void> | void;
};

export function SettingsRevenueCatDebugCard({
  session,
  copy,
  textPrimaryColor,
  textSecondaryColor,
  cardBackgroundColor,
  cardBorderColor,
  onOpenPaywall,
  onBillingChanged,
}: SettingsRevenueCatDebugCardProps) {
  const {
    apiKey,
    entitlementCode,
    backendSyncEnabled,
    error,
    isPending,
    result,
    runAction,
    ensureConfigured,
    loadOfferings,
    purchasePlan,
    restore,
    resetToFree,
    snapshot,
  } = useRevenueCatDebugController({
    session,
    copy,
    onBillingChanged,
  });

  return (
    <View
      style={[
        styles.debugToolboxCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
        },
      ]}
    >
      <View style={styles.debugToolboxIntro}>
        <Text style={[styles.debugToolboxTitle, { color: textPrimaryColor }]}>
          {copy.title}
        </Text>
        <Text
          style={[styles.debugToolboxHint, { color: textSecondaryColor }]}
        >
          {copy.hint}
        </Text>
        <Text
          style={[styles.debugToolboxMeta, { color: textSecondaryColor }]}
        >
          {copy.sandboxOnly}
        </Text>
        <Text
          style={[styles.debugToolboxMeta, { color: textSecondaryColor }]}
        >
          {apiKey ? copy.apiKeyPresent : copy.apiKeyMissing} · {copy.entitlement}:{" "}
          {entitlementCode} · {backendSyncEnabled ? copy.syncEnabled : copy.syncDisabled}
        </Text>
      </View>

      <View style={styles.debugActionWrap}>
        <Pressable
          onPress={onOpenPaywall}
          disabled={isPending}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.openPaywall}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            void runAction(copy.configure, async () => {
              await ensureConfigured();
              return {
                configured: true,
                accountId: session?.account.id ?? null,
                entitlementCode,
              };
            })
          }
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.configure}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            void runAction(copy.offerings, async () => {
              return loadOfferings();
            })
          }
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.offerings}</Text>
        </Pressable>

        <Pressable
          onPress={() => void runAction(copy.buyMonthly, () => purchasePlan("monthly"))}
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipPrimary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipPrimaryText}>{copy.buyMonthly}</Text>
        </Pressable>

        <Pressable
          onPress={() => void runAction(copy.buyAnnual, () => purchasePlan("annual"))}
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipPrimary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipPrimaryText}>{copy.buyAnnual}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            void runAction(copy.restore, restore)
          }
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.restore}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            void runAction(copy.snapshot, snapshot)
          }
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.snapshot}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            void runAction(copy.resetToFree, resetToFree)
          }
          disabled={isPending || !session}
          style={({ pressed }) => [
            styles.debugActionChip,
            styles.debugActionChipSecondary,
            pressed ? styles.chipPressed : null,
            isPending || !session ? styles.chipDisabled : null,
          ]}
        >
          <Text style={styles.debugActionChipSecondaryText}>{copy.resetToFree}</Text>
        </Pressable>
      </View>

      <View style={styles.debugConsole}>
        <Text style={styles.debugConsoleStatus}>
          {isPending ? copy.working : copy.ready}
          {result ? ` · ${result.label}` : ""}
        </Text>
        {error ? <Text style={styles.debugConsoleError}>{error}</Text> : null}
        <Text style={styles.debugConsoleText}>
          {serializeRevenueCatDebugResult(result) || copy.noResult}
        </Text>
      </View>
    </View>
  );
}
