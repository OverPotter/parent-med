import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import {
  buildChildProfileScreenContent,
  ChildProfileJournalItem,
} from "../model/childProfileRedesign";
import { ChildExportSheet } from "../export/ChildExportSheet";
import { styles } from "./childProfileRedesignStyles";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { getChildModuleTint } from "../../../shared/theme/childModuleTints";

type ChildProfileRedesignScreenProps = {
  child: ChildCard;
  visible: boolean;
  onBack: () => void;
  onEditProfile?: () => void;
  onOpenAnalytics?: () => void;
  onOpenJournalEntry?: (
    kind: "feeding" | "sleep" | "weight" | "height" | "overview",
  ) => void;
};

const noop = () => {};

export function ChildProfileRedesignScreen({
  child,
  visible,
  onBack,
  onEditProfile,
  onOpenAnalytics,
  onOpenJournalEntry,
}: ChildProfileRedesignScreenProps) {
  const { copy, locale } = useMobileI18n();
  const content = buildChildProfileScreenContent(child, locale);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const handleEditProfile = onEditProfile ?? noop;
  const handleOpenAnalytics = onOpenAnalytics ?? noop;
  const handleOpenJournalEntry = onOpenJournalEntry ?? noop;
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible && !isExportSheetOpen,
    width,
    onBack,
  });

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlayLayer,
        visible ? styles.overlayLayerVisible : styles.overlayLayerHidden,
        { transform: [{ translateX }] },
      ]}
    >
      <ImageBackground
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>{content.backLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={styles.photoWrap}>
                  <Image
                    source={content.avatarSource}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.summary}>
                  <Text style={styles.childName}>{content.childName}</Text>

                  <View style={styles.statsRow}>
                    <StatsChip
                      label={copy.childProfile.stats.age}
                      value={content.ageValue}
                    />
                    <StatsChip
                      label={copy.childProfile.stats.weight}
                      value={content.weightValue}
                    />
                  </View>

                  <View style={styles.statsRow}>
                    <StatsChip
                      label={copy.childProfile.stats.height}
                      value={content.heightValue}
                    />
                    <StatsChip
                      label={copy.childProfile.stats.allergies}
                      value={content.allergiesValue}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.statusPillsRow}>
                {content.statusPills.map((pill) => (
                  <View key={pill} style={styles.statusPill}>
                    <View style={styles.statusPillDot} />
                    <Text style={styles.statusPillText}>{pill}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleEditProfile}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed ? styles.editButtonPressed : null,
                ]}
              >
                <Feather name="edit-2" size={14} color="#E0846D" />
                <Text style={styles.editButtonText}>
                  {content.editProfileLabel}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>{content.journalTitle}</Text>

            <View style={styles.journalGrid}>
              {content.journalRows.map((row, index) => (
                <View
                  key={`${content.journalTitle}-${index}`}
                  style={styles.journalRow}
                >
                  {row.map((item) => (
                    <JournalItem
                      key={item.id}
                      item={item}
                      onPress={() => {
                        if (item.iconVariant === "illnessBadge") {
                          handleOpenAnalytics();
                          return;
                        }

                        if (item.targetKind) {
                          handleOpenJournalEntry(item.targetKind);
                          return;
                        }

                        noop();
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>

            <Pressable
              onPress={noop}
              style={({ pressed }) => [
                styles.notesBlock,
                pressed ? styles.notesPressed : null,
              ]}
            >
              <Text style={styles.notesTitle}>{content.notesTitle}</Text>
              <Text style={styles.notesBody}>{content.notesBody}</Text>
            </Pressable>

            <Pressable
              onPress={() => setIsExportSheetOpen(true)}
              style={({ pressed }) => [
                styles.exportCard,
                pressed ? styles.exportPressed : null,
              ]}
            >
              <View style={styles.exportIconWrap}>
                <Feather name="share-2" size={16} color="#E0846D" />
              </View>
              <View style={styles.exportTextWrap}>
                <Text style={styles.exportTitle}>{content.exportTitle}</Text>
                <Text style={styles.exportCaption}>
                  {content.exportCaption}
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </ImageBackground>
      <ChildExportSheet
        visible={isExportSheetOpen}
        onClose={() => setIsExportSheetOpen(false)}
      />
    </Animated.View>
  );
}

function StatsChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statsChip}>
      <Text style={styles.statsLabel}>{label}</Text>
      <Text style={styles.statsValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function JournalItem({
  item,
  onPress,
}: {
  item: ChildProfileJournalItem;
  onPress: () => void;
}) {
  const tint = getJournalItemTint(item.iconVariant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.journalItem,
        {
          backgroundColor: tint.backgroundColor,
          borderColor: tint.borderColor,
        },
        pressed ? styles.journalItemPressed : null,
      ]}
    >
      <View style={styles.journalIconWrap}>
        <JournalIcon item={item} />
      </View>
      <Text style={styles.journalItemLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={12} color="#A4AEB9" />
    </Pressable>
  );
}

function JournalIcon({ item }: { item: ChildProfileJournalItem }) {
  if (item.imageSource) {
    return (
      <Image
        source={item.imageSource}
        style={{ width: 36, height: 36 }}
        resizeMode="contain"
      />
    );
  }

  if (item.iconVariant === "weight") {
    return (
      <MaterialCommunityIcons
        name="scale-bathroom"
        size={32}
        color={item.iconColor ?? "#6AA58E"}
      />
    );
  }

  return <Feather name="clipboard" size={32} color="#D881A5" />;
}

function getJournalItemTint(iconVariant: ChildProfileJournalItem["iconVariant"]) {
  if (iconVariant === "sleep") {
    return getChildModuleTint("sleep");
  }

  if (iconVariant === "feeding") {
    return getChildModuleTint("feeding");
  }

  if (iconVariant === "illnessBadge") {
    return getChildModuleTint("illness");
  }

  if (iconVariant === "overview") {
    return getChildModuleTint("overview");
  }

  if (iconVariant === "height") {
    return getChildModuleTint("height");
  }

  return getChildModuleTint("weight");
}
