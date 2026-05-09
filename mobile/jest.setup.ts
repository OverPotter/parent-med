import { View } from "react-native";

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View: MockView } = require("react-native");

  return {
    LinearGradient: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
    }) => React.createElement(MockView, props, children),
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text: MockText } = require("react-native");

  return {
    MaterialCommunityIcons: ({ name }: { name?: string }) =>
      React.createElement(MockText, null, name ?? "icon"),
  };
});

jest.mock("./src/shared/components/FormBottomSheet", () => {
  const React = require("react");
  const { View: MockView } = require("react-native");

  return {
    FormBottomSheet: ({
      children,
      visible,
    }: {
      children: (args: { panHandlers: Record<string, never> }) => React.ReactNode;
      visible: boolean;
    }) => {
      if (!visible) {
        return null;
      }

      return React.createElement(MockView, null, children({ panHandlers: {} }));
    },
  };
});

jest.mock("./src/features/auth/model/authScreen", () => {
  const actual = jest.requireActual("./src/features/auth/model/authScreen");

  return {
    ...actual,
    buildAuthScreenContent: (locale: "ru" | "en" | "pl" | "de") => ({
      ...actual.buildAuthScreenContent(locale),
      backgroundSource: 1,
    }),
  };
});
