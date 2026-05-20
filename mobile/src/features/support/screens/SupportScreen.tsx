import { useEffect, useState } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { childrenScreenAssets } from "../../../redesign/screens/children/manifest";
import { useEdgeSwipeBack } from "../../../shared/hooks/useEdgeSwipeBack";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";
import { useMobileSurfaceTheme } from "../../../shared/theme/mobileSurfaceTheme";
import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  MobileSupportApiError,
  submitPublicSupportRequest,
} from "../api/supportApi";
import { buildSupportScreenContent } from "../model/supportScreen";
import { styles } from "./supportScreenStyles";

type SupportScreenProps = {
  visible: boolean;
  onBack: () => void;
  session: MobileAuthSession | null;
};

export function SupportScreen({
  visible,
  onBack,
  session,
}: SupportScreenProps) {
  const { locale } = useMobileI18n();
  const surfaceTheme = useMobileSurfaceTheme();
  const content = buildSupportScreenContent(locale);
  const [replyContact, setReplyContact] = useState(session?.account.email ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const { width } = useWindowDimensions();
  const { panHandlers, swipeCaptureWidth, translateX } = useEdgeSwipeBack({
    enabled: visible && !pending,
    width,
    onBack,
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    setReplyContact(session?.account.email ?? "");
    setMessage("");
    setError(null);
    setSuccess(false);
  }, [session?.account.email, visible]);

  const handleSubmit = async () => {
    const normalizedReplyContact = replyContact.trim();
    const normalizedMessage = message.trim();

    if (!normalizedReplyContact) {
      setError(content.errors.replyContact);
      setSuccess(false);
      return;
    }

    if (!normalizedMessage) {
      setError(content.errors.message);
      setSuccess(false);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      await submitPublicSupportRequest({
        replyContact: normalizedReplyContact,
        message: normalizedMessage,
      });
      setSuccess(true);
      setMessage("");
    } catch (errorValue) {
      if (
        errorValue instanceof MobileSupportApiError &&
        errorValue.code === "PUBLIC_SUPPORT_RATE_LIMITED"
      ) {
        setError(content.errors.rateLimited);
      } else if (
        errorValue instanceof MobileSupportApiError &&
        errorValue.detail
      ) {
        setError(errorValue.detail);
      } else {
        setError(content.errors.generic);
      }
    } finally {
      setPending(false);
    }
  };

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
        <View
          style={[
            styles.overlay,
            { backgroundColor: surfaceTheme.backgroundOverlaySoftColor },
          ]}
        />
        <View style={styles.root}>
          <View
            style={[styles.swipeBackEdge, { width: swipeCaptureWidth }]}
            {...panHandlers}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              <Pressable onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>
                  {"← "}
                  {content.backLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.introBlock}>
              <Text style={[styles.title, { color: surfaceTheme.textPrimaryColor }]}>
                {content.title}
              </Text>
              <Text style={[styles.subtitle, { color: surfaceTheme.textSecondaryColor }]}>
                {content.subtitle}
              </Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: surfaceTheme.textPrimaryColor }]}>
                {content.contactLabel}
              </Text>
              <TextInput
                value={replyContact}
                onChangeText={setReplyContact}
                style={[
                  styles.input,
                  {
                    backgroundColor: surfaceTheme.inputBackgroundColor,
                    borderColor: surfaceTheme.inputBorderColor,
                    color: surfaceTheme.textPrimaryColor,
                  },
                ]}
                placeholder={content.contactPlaceholder}
                placeholderTextColor="#98A2AD"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!pending}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: surfaceTheme.textPrimaryColor }]}>
                {content.messageLabel}
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                style={[
                  styles.input,
                  styles.messageInput,
                  {
                    backgroundColor: surfaceTheme.inputBackgroundColor,
                    borderColor: surfaceTheme.inputBorderColor,
                    color: surfaceTheme.textPrimaryColor,
                  },
                ]}
                placeholder={content.messagePlaceholder}
                placeholderTextColor="#98A2AD"
                multiline
                editable={!pending}
              />
            </View>

            <Text style={[styles.privacyHint, { color: surfaceTheme.textSecondaryColor }]}>
              {content.privacyHint}
            </Text>

            {error ? <Text style={styles.errorNote}>{error}</Text> : null}
            {success ? (
              <Text style={styles.successNote}>{content.successLabel}</Text>
            ) : null}

            <Pressable
              onPress={() => {
                void handleSubmit();
              }}
              disabled={pending}
              style={({ pressed }) => [
                styles.submitButton,
                pressed ? styles.submitButtonPressed : null,
                pending ? styles.submitButtonDisabled : null,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {pending ? content.submittingLabel : content.submitLabel}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}
