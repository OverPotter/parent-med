import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MobileI18nProvider } from "../../../../shared/i18n/mobileI18n";
import { MedicineCabinetAddChoiceSheet } from "../MedicineCabinetAddChoiceSheet";

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "ru-RU", languageCode: "ru" }]),
}));

jest.mock("../../../../shared/components/FormBottomSheet", () => ({
  FormBottomSheet: ({
    children,
    onClose,
    visible,
  }: {
    children: (props: {
      panHandlers: Record<string, never>;
      requestClose: (afterClose?: () => void) => void;
    }) => React.ReactNode;
    onClose: () => void;
    visible: boolean;
  }) => {
    if (!visible) {
      return null;
    }

    return children({
      panHandlers: {},
      requestClose: (afterClose?: () => void) => {
        afterClose?.();
        onClose();
      },
    });
  },
}));

function renderSheet(
  props?: Partial<React.ComponentProps<typeof MedicineCabinetAddChoiceSheet>>,
) {
  return render(
    <MobileI18nProvider>
      <MedicineCabinetAddChoiceSheet
        visible
        onClose={jest.fn()}
        addFromCatalogLocked={false}
        onOpenLockedCatalog={jest.fn()}
        onOpenReferenceCreate={jest.fn()}
        onOpenManualCreate={jest.fn()}
        {...props}
      />
    </MobileI18nProvider>,
  );
}

describe("MedicineCabinetAddChoiceSheet", () => {
  it("opens locked catalog flow instead of reference create when Plus is required", () => {
    const onClose = jest.fn();
    const onOpenLockedCatalog = jest.fn();
    const onOpenReferenceCreate = jest.fn();
    const screen = renderSheet({
      onClose,
      addFromCatalogLocked: true,
      onOpenLockedCatalog,
      onOpenReferenceCreate,
    });

    fireEvent.press(screen.getByText("Из справочника"));

    expect(onOpenLockedCatalog).toHaveBeenCalledTimes(1);
    expect(onOpenReferenceCreate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens reference create flow when catalog is available", () => {
    const onClose = jest.fn();
    const onOpenLockedCatalog = jest.fn();
    const onOpenReferenceCreate = jest.fn();
    const screen = renderSheet({
      onClose,
      addFromCatalogLocked: false,
      onOpenLockedCatalog,
      onOpenReferenceCreate,
    });

    fireEvent.press(screen.getByText("Из справочника"));

    expect(onOpenReferenceCreate).toHaveBeenCalledTimes(1);
    expect(onOpenLockedCatalog).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
