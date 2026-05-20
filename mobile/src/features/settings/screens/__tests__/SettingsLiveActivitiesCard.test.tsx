import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MobileThemeProvider } from "../../../../shared/theme/mobileSurfaceTheme";
import { LiveActivitiesSettingsCard } from "../SettingsLiveActivitiesCard";

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

function renderCard(props?: Partial<React.ComponentProps<typeof LiveActivitiesSettingsCard>>) {
  return render(
    <MobileThemeProvider>
      <LiveActivitiesSettingsCard
        unavailableHint="Plus feature"
        showUnavailableHint
        sleepTitle="Sleep"
        sleepHint="Sleep hint"
        sleepEnabled={false}
        feedingTitle="Feeding"
        feedingHint="Feeding hint"
        feedingEnabled={false}
        illnessTitle="Illness"
        illnessHint="Illness hint"
        illnessEnabled={false}
        disabled={false}
        onPressUnavailable={jest.fn()}
        onToggleSleep={jest.fn()}
        onToggleFeeding={jest.fn()}
        onToggleIllness={jest.fn()}
        {...props}
      />
    </MobileThemeProvider>,
  );
}

describe("LiveActivitiesSettingsCard", () => {
  it("opens paywall callback when locked row is pressed", () => {
    const onPressUnavailable = jest.fn();
    const onToggleSleep = jest.fn();
    const screen = renderCard({
      onPressUnavailable,
      onToggleSleep,
    });

    fireEvent.press(screen.getByText("Sleep"));

    expect(onPressUnavailable).toHaveBeenCalledTimes(1);
    expect(onToggleSleep).not.toHaveBeenCalled();
  });
});
