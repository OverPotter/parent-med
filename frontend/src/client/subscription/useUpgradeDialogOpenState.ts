import { useState } from "react";

export function useUpgradeDialogOpenState(initialOpen = false) {
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(initialOpen);

  return {
    isUpgradeDialogOpen,
    setIsUpgradeDialogOpen,
    openUpgradeDialog: () => setIsUpgradeDialogOpen(true),
    closeUpgradeDialog: () => setIsUpgradeDialogOpen(false),
  };
}
