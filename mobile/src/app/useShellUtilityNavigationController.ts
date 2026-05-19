import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import { openChildrenRoot } from "./shellNavigation";
import type { PillPathActiveScreen } from "./pillPathExpoShellModel";

export function useShellUtilityNavigationController({
  setActiveRootTab,
  setActiveScreen,
}: {
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
}) {
  const handleOpenFamily = useCallback(() => {
    setActiveScreen("family");
  }, [setActiveScreen]);

  const handleCloseFamily = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleOpenChildrenFromFamily = useCallback(() => {
    openChildrenRoot(setActiveRootTab, setActiveScreen);
  }, [setActiveRootTab, setActiveScreen]);

  const handleOpenPillboxFromFamily = useCallback(() => {
    setActiveRootTab("pillbox");
    setActiveScreen("children");
  }, [setActiveRootTab, setActiveScreen]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    setActiveScreen("privacyPolicy");
  }, [setActiveScreen]);

  const handleOpenHelp = useCallback(() => {
    setActiveScreen("help");
  }, [setActiveScreen]);

  const handleOpenSupport = useCallback(() => {
    setActiveScreen("support");
  }, [setActiveScreen]);

  const handleOpenSettings = useCallback(() => {
    setActiveScreen("settings");
  }, [setActiveScreen]);

  const handleCloseSettings = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseSupport = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleCloseHelp = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleClosePrivacyPolicy = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  const handleOpenTermsOfUse = useCallback(() => {
    setActiveScreen("termsOfUse");
  }, [setActiveScreen]);

  const handleCloseTermsOfUse = useCallback(() => {
    setActiveScreen("children");
  }, [setActiveScreen]);

  return {
    handleCloseFamily,
    handleCloseHelp,
    handleClosePrivacyPolicy,
    handleCloseSettings,
    handleCloseSupport,
    handleCloseTermsOfUse,
    handleOpenFamily,
    handleOpenChildrenFromFamily,
    handleOpenHelp,
    handleOpenPillboxFromFamily,
    handleOpenPrivacyPolicy,
    handleOpenSettings,
    handleOpenSupport,
    handleOpenTermsOfUse,
  };
}
