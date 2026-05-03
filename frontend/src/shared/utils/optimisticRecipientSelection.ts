export function toggleNormalizedRecipientSelection(
  memberId: string,
  selectedIds: string[],
  normalizeSelection: (nextIds: string[]) => string[]
): string[] {
  const toggledIds = selectedIds.includes(memberId)
    ? selectedIds.filter((id) => id !== memberId)
    : [...selectedIds, memberId];
  return normalizeSelection(toggledIds);
}

export async function runOptimisticRecipientSelectionUpdate(params: {
  previousIds: string[];
  nextIds: string[];
  applySelection: (ids: string[]) => void;
  setSubmitting: (value: boolean) => void;
  submitSelection: (ids: string[]) => void | Promise<void>;
}) {
  const { previousIds, nextIds, applySelection, setSubmitting, submitSelection } = params;

  applySelection(nextIds);
  setSubmitting(true);
  try {
    await submitSelection(nextIds);
    return true;
  } catch {
    applySelection(previousIds);
    return false;
  } finally {
    setSubmitting(false);
  }
}
