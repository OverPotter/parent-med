export type ChildModuleTint = {
  backgroundColor: string;
  borderColor: string;
};

export type ChildModuleTintKey =
  | "sleep"
  | "feeding"
  | "observation"
  | "profile"
  | "overview"
  | "illness"
  | "height"
  | "weight";

const baseTints: Record<ChildModuleTintKey, ChildModuleTint> = {
  sleep: {
    backgroundColor: "#EDE0FF",
    borderColor: "#CDB2FA",
  },
  feeding: {
    backgroundColor: "#FFF3E6",
    borderColor: "#F3D7BB",
  },
  observation: {
    backgroundColor: "#EAF8F0",
    borderColor: "#CEE4D8",
  },
  profile: {
    backgroundColor: "#FFF0ED",
    borderColor: "#F0CFC9",
  },
  overview: {
    backgroundColor: "#EAF4FF",
    borderColor: "#C8DCF5",
  },
  illness: {
    backgroundColor: "#FFEDEA",
    borderColor: "#F3CCC5",
  },
  height: {
    backgroundColor: "#F5F0FF",
    borderColor: "#DDD1F7",
  },
  weight: {
    backgroundColor: "#EAF8F0",
    borderColor: "#CEE4D8",
  },
};

export function getChildModuleTint(key: ChildModuleTintKey): ChildModuleTint {
  return baseTints[key];
}
