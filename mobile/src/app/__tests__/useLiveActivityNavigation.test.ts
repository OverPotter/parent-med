import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Linking } from "react-native";
import type { MobileAuthSession } from "../../features/auth/api/authApi";
import type { MobileChildSummary } from "../../features/children/api/childrenApi";
import { useLiveActivityNavigation } from "../useLiveActivityNavigation";

function makeAuthSession(): MobileAuthSession {
  return {
    tokenType: "bearer",
    accessToken: "token",
    refreshToken: "refresh",
    account: {
      id: "acc-1",
      email: "parent@example.com",
      familyId: "family-1",
      displayName: "Parent",
      relationshipLabel: "Mom",
      phone: null,
      preferredLanguage: "ru",
      familyRole: "owner",
      hasRecoveryCode: true,
    },
    family: {
      id: "family-1",
      name: "Family",
      ownerAccountId: "acc-1",
    },
  };
}

function makeChild(id: string): MobileChildSummary {
  return {
    id,
    familyId: "family-1",
    name: `Child ${id}`,
    birthDate: "2024-05-01",
    ageLabel: "2 years",
    babyModeEnabled: true,
    avatarKey: null,
    gender: null,
    allergies: null,
    notes: null,
  };
}

type ProbeProps = {
  authSession: MobileAuthSession | null;
  children: MobileChildSummary[];
  onSelectChild: jest.Mock;
  onOpenChildren: jest.Mock;
  onOpenIllnessJournal: jest.Mock;
};

function Probe(props: ProbeProps) {
  useLiveActivityNavigation(props);
  return null;
}

describe("useLiveActivityNavigation", () => {
  let urlListener: ((event: { url: string }) => void) | null = null;
  let subscriptionRemove: jest.Mock;
  let getInitialUrlSpy: jest.SpiedFunction<typeof Linking.getInitialURL>;
  let addEventListenerSpy: jest.SpiedFunction<typeof Linking.addEventListener>;

  beforeEach(() => {
    jest.resetAllMocks();
    urlListener = null;
    subscriptionRemove = jest.fn();
    getInitialUrlSpy = jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    addEventListenerSpy = jest
      .spyOn(Linking, "addEventListener")
      .mockImplementation((event, listener) => {
        if (event === "url") {
          urlListener = listener as (event: { url: string }) => void;
        }

        return {
          remove: subscriptionRemove,
        } as unknown as ReturnType<typeof Linking.addEventListener>;
      });
  });

  it("routes sleep live activity to children root", async () => {
    getInitialUrlSpy.mockResolvedValue(
      "pillpath://children?liveChild=child-1&liveAction=sleep",
    );

    const onSelectChild = jest.fn();
    const onOpenChildren = jest.fn();
    const onOpenIllnessJournal = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          authSession: makeAuthSession(),
          children: [makeChild("child-1")],
          onSelectChild,
          onOpenChildren,
          onOpenIllnessJournal,
        }),
      );
    });

    expect(onSelectChild).toHaveBeenCalledWith("child-1");
    expect(onOpenChildren).toHaveBeenCalledTimes(1);
    expect(onOpenIllnessJournal).not.toHaveBeenCalled();
  });

  it("routes illness live activity to journal from runtime link events", async () => {
    const onSelectChild = jest.fn();
    const onOpenChildren = jest.fn();
    const onOpenIllnessJournal = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          authSession: makeAuthSession(),
          children: [makeChild("child-2")],
          onSelectChild,
          onOpenChildren,
          onOpenIllnessJournal,
        }),
      );
    });

    await act(async () => {
      urlListener?.({
        url: "pillpath://children?liveChild=child-2&liveAction=illness",
      });
    });

    expect(onSelectChild).toHaveBeenCalledWith("child-2");
    expect(onOpenIllnessJournal).toHaveBeenCalledWith("child-2");
    expect(onOpenChildren).not.toHaveBeenCalled();
  });

  it("keeps pending navigation until auth session and child data are ready", async () => {
    getInitialUrlSpy.mockResolvedValue(
      "pillpath://children?liveChild=child-3&liveAction=feeding",
    );

    const onSelectChild = jest.fn();
    const onOpenChildren = jest.fn();
    const onOpenIllnessJournal = jest.fn();

    let tree: { update: (element: React.ReactElement) => void };

    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(Probe, {
          authSession: null,
          children: [],
          onSelectChild,
          onOpenChildren,
          onOpenIllnessJournal,
        }),
      );
    });

    expect(onSelectChild).not.toHaveBeenCalled();

    await act(async () => {
      tree!.update(
        React.createElement(Probe, {
          authSession: makeAuthSession(),
          children: [makeChild("child-3")],
          onSelectChild,
          onOpenChildren,
          onOpenIllnessJournal,
        }),
      );
    });

    expect(onSelectChild).toHaveBeenCalledWith("child-3");
    expect(onOpenChildren).toHaveBeenCalledTimes(1);
  });
});
