import type { ReactNode, RefObject } from "react";
import { Animated, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { styles } from "./familyScreenStyles";

type FamilyOverlayScaffoldProps = {
  backLabel: string;
  backgroundOverlayVisible?: boolean;
  children: ReactNode;
  onBack: () => void;
  overlayChildren?: ReactNode;
  panHandlers: object;
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
  scrollViewRef?: RefObject<ScrollView | null>;
  swipeCaptureWidth: number;
  textColor: string;
  translateX: Animated.Value;
  visible?: boolean;
};

export function FamilyOverlayScaffold({
  backLabel,
  backgroundOverlayVisible = true,
  children,
  onBack,
  overlayChildren,
  panHandlers,
  pointerEvents = "auto",
  scrollViewRef,
  swipeCaptureWidth,
  textColor,
  translateX,
  visible = true,
}: FamilyOverlayScaffoldProps) {
  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        !backgroundOverlayVisible ? styles.innerOverlayLayer : null,
        { transform: [{ translateX }] },
      ]}
    >
      <ImageBackground
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={[
            "rgba(255,244,236,0.96)",
            "rgba(255,250,246,0.98)",
            "rgba(255,253,249,1)",
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={styles.overlayGradient}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={[styles.backLinkText, { color: textColor }]}>
                  {"← "}{backLabel}
                </Text>
              </Pressable>
            </View>

            {children}
          </ScrollView>

          {overlayChildren}
        </View>
      </ImageBackground>
    </Animated.View>
  );
}
