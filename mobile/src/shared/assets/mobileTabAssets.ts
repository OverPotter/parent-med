import type { ImageSourcePropType } from "react-native";
import { redesignSharedIcons } from "../../redesign/shared/icons";
import type { MobileBottomTabKey } from "../components/mobileBottomTabModel";

export const mobileTabAssets: Record<MobileBottomTabKey, ImageSourcePropType> =
  {
    journal: redesignSharedIcons.journalBook,
    children: require("./bottom-tabs/optimized/children_tab_ui_v2.png"),
    pillbox: require("./bottom-tabs/optimized/pillbox_tab_ui.png"),
    cabinet: require("./bottom-tabs/optimized/cabinet_tab_ui.png"),
    more: require("./bottom-tabs/optimized/more_tab_ui.png"),
  };
