import { redesignSharedIcons } from "../../shared/icons";

export const childrenScreenSpec = require("./child_page.json");

export const childrenScreenAssets = {
  background: require("../../shared/backgrounds/children_module_background_1179x2556.webp"),
  icons: {
    sleep: redesignSharedIcons.sleep,
    feeding: redesignSharedIcons.feeding,
    observation: redesignSharedIcons.observation,
    profile: redesignSharedIcons.profile,
  },
  avatars: {
    boy: require("./avatars/boy_transparent.png"),
    boyBlackHair: require("./avatars/boy_black_hair_transparent.png"),
    boyRedHair: require("./avatars/boy_red_hair_transparent.png"),
    girl: require("./avatars/girl_transparent.png"),
    girlBlonde: require("./avatars/girl_blonde_transparent.png"),
    child1: require("./avatars/child_icon_transparent_1.png"),
    child2: require("./avatars/child_icon_transparent_2.png"),
    child3: require("./avatars/child_icon_transparent_3.png"),
  },
} as const;
