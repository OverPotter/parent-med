import type { ImageSourcePropType } from "react-native";
import { redesignSharedIcons } from "../../redesign/shared/icons";
import type { MobileBottomTabKey } from "../components/mobileBottomTabModel";

export const mobileTabAssets: Record<MobileBottomTabKey, ImageSourcePropType> =
  {
    journal: redesignSharedIcons.journalBook,
    children: require("./bottom-tabs/parent_child_transparent_ui.png"),
    pillbox: require("./bottom-tabs/pillpath_icon_transparent_ui.png"),
    cabinet: require("./bottom-tabs/medical_bag_icon_transparent_FIXED_ui.png"),
    more: require("./bottom-tabs/chat_bubble_icon_transparent_ui.png"),
  };
