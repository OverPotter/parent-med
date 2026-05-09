import { useState } from "react";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import { buildMoreScreenContent } from "../model/moreScreen";
import { MoreNavCard } from "./MoreNavCard";
import { MoreProfileCard } from "./MoreProfileCard";
import { styles } from "./moreScreenStyles";

type MoreScreenProps = {
  session: MobileAuthSession;
  onLogout?: () => void | Promise<void>;
  onOpenFamily?: () => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onUpdateSession?: (patch: {
    familyName?: string;
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => void | Promise<void>;
};

const noop = () => {};

export function MoreScreen({
  session,
  onLogout = noop,
  onOpenFamily = noop,
  onOpenSettings = noop,
  onOpenSupport = noop,
  onOpenTerms = noop,
  onOpenPrivacy = noop,
  onUpdateSession = noop,
}: MoreScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildMoreScreenContent(locale, session);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: surfaceTheme.appBackgroundColor }]}>
      <ImageBackground
        source={childrenScreenAssets.background}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlayColor },
          ]}
        />
      </ImageBackground>

      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}>
              {content.title}
            </Text>
            <Text style={[styles.subtitle, { color: surfaceTheme.textSecondaryColor }]}>
              {content.subtitle}
            </Text>
          </View>

          <MoreProfileCard
            session={session}
            content={content}
            onUpdateSession={onUpdateSession}
          />

          <Text style={[styles.sectionTitle, { color: surfaceTheme.textPrimaryColor }]}>
            {content.sectionTitle}
          </Text>

          <View style={styles.navSection}>
            <MoreNavCard
              items={content.navItems}
              onOpenFamily={onOpenFamily}
              onOpenSettings={onOpenSettings}
              onOpenSupport={onOpenSupport}
              onOpenTerms={onOpenTerms}
              onOpenPrivacy={onOpenPrivacy}
            />
          </View>

          <View style={styles.logoutWrap}>
            <Pressable
              onPress={() => {
                setLogoutConfirmVisible(true);
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  backgroundColor: surfaceTheme.cardMutedBackgroundColor,
                  borderColor: surfaceTheme.cardBorderColor,
                },
                pressed ? styles.inlineActionButtonPressed : null,
              ]}
            >
              <Text style={styles.logoutText}>{content.logoutLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {logoutConfirmVisible ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setLogoutConfirmVisible(false)}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>{content.logoutConfirmTitle}</Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setLogoutConfirmVisible(false)}
                  style={({ pressed }) => [
                    styles.confirmButtonSecondary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonSecondaryText}>
                    {content.logoutConfirmCancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setLogoutConfirmVisible(false);
                    void onLogout();
                  }}
                  style={({ pressed }) => [
                    styles.confirmButtonPrimary,
                    pressed ? styles.confirmButtonPressed : null,
                  ]}
                >
                  <Text style={styles.confirmButtonPrimaryText}>
                    {content.logoutConfirmAccept}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
