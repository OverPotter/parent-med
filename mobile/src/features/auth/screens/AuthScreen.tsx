import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  ImageBackground,
  Keyboard,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormBottomSheet } from "../../../shared/components/FormBottomSheet";
import {
  fetchFamilyInvitePreview,
  loginWithPassword,
  registerWithPassword,
  resetPasswordByRecoveryCode,
  toBackendPreferredLanguage,
  type MobileAuthSession,
} from "../api/authApi";
import {
  buildAuthScreenContent,
  type AuthFieldId,
} from "../model/authScreen";
import {
  buildAuthFormErrors,
  buildForgotPasswordErrors,
  clamp,
  findFirstVisibleError,
  getAuthErrorMessage,
  normalizeFormValue,
  resolveKeyboardOffset,
  type FieldTouchedState,
  type ForgotPasswordFieldId,
  type ForgotPasswordState,
  type ForgotPasswordValidationErrors,
  type FormState,
} from "../model/authScreenHelpers";
import {
  buildVerifiedFamilyCode,
  normalizeFamilyCodeInput,
  resolveFamilyCodeSubmitError,
  resolveFamilyCodeVerifyError,
  resetVerifiedFamilyCode,
  shouldAutoVerifyFamilyCode,
  type VerifiedFamilyCode,
} from "../model/familyCode";
import {
  normalizeRecoveryCode,
} from "../model/recoveryCode";
import {
  AuthBottomArea,
  ForgotPasswordSheetContent,
} from "./AuthScreenParts";
import { AuthFormCard } from "./AuthFormCard";
import { styles } from "./authScreenStyles";
import { useMobileI18n } from "../../../shared/i18n/mobileI18n";

type AuthTabKey = "login" | "register";

type AuthScreenProps = {
  onAuthenticated?: (session: MobileAuthSession) => void;
};

type FormStateByTab = Record<AuthTabKey, FormState>;

type PasswordVisibilityState = Record<"password" | "passwordConfirm", boolean>;
type ForgotPasswordVisibilityState = Record<
  "newPassword" | "passwordConfirm",
  boolean
>;
type FocusedFieldId =
  | "email"
  | "password"
  | "passwordConfirm"
  | "familyCode"
  | null;
type LayoutFieldId = Exclude<FocusedFieldId, null>;
type FieldLayout = {
  y: number;
  height: number;
};
type FieldFrame = {
  pageY: number;
  height: number;
};

const noop = () => {};
const initialFormState: FormState = {
  email: "",
  password: "",
  passwordConfirm: "",
  familyCode: "",
};
const initialPasswordVisibilityState: PasswordVisibilityState = {
  password: false,
  passwordConfirm: false,
};
const initialForgotPasswordState: ForgotPasswordState = {
  email: "",
  recoveryCode: "",
  newPassword: "",
  passwordConfirm: "",
};
const initialForgotPasswordVisibilityState: ForgotPasswordVisibilityState = {
  newPassword: false,
  passwordConfirm: false,
};

export function AuthScreen({ onAuthenticated = noop }: AuthScreenProps) {
  const { locale } = useMobileI18n();
  const { height: windowHeight } = useWindowDimensions();
  const content = buildAuthScreenContent(locale);
  const [activeTab, setActiveTab] = useState<AuthTabKey>("login");
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibilityState>(
    initialPasswordVisibilityState,
  );
  const [familyCodeOpen, setFamilyCodeOpen] = useState(false);
  const [familyCodeError, setFamilyCodeError] = useState<string | null>(null);
  const [verifiedFamilyCode, setVerifiedFamilyCode] = useState<VerifiedFamilyCode | null>(null);
  const [isVerifyingFamilyCode, setIsVerifyingFamilyCode] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordState, setForgotPasswordState] = useState<ForgotPasswordState>(
    initialForgotPasswordState,
  );
  const [forgotPasswordVisibility, setForgotPasswordVisibility] =
    useState<ForgotPasswordVisibilityState>(initialForgotPasswordVisibilityState);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<FieldTouchedState<AuthFieldId>>({});
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);
  const [forgotPasswordTouched, setForgotPasswordTouched] = useState<
    FieldTouchedState<ForgotPasswordFieldId>
  >({});
  const [tabsWidth, setTabsWidth] = useState(0);
  const [formStateByTab, setFormStateByTab] = useState<FormStateByTab>({
    login: { ...initialFormState },
    register: { ...initialFormState },
  });
  const indicatorX = useRef(new Animated.Value(0)).current;
  const contentShiftY = useRef(new Animated.Value(0)).current;
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const focusedFieldRef = useRef<FocusedFieldId>(null);
  const fieldRefs = useRef<Partial<Record<LayoutFieldId, View | null>>>({});
  const keyboardHeightRef = useRef(0);
  const scrollOffsetYRef = useRef(0);
  const fieldLayoutsRef = useRef<Partial<Record<LayoutFieldId, FieldLayout>>>({});

  const isRegisterMode = activeTab === "register";
  const formState = formStateByTab[activeTab];
  const fields =
    activeTab === "login" ? content.loginFields : content.registerFields;
  const passwordsMismatch =
    isRegisterMode &&
    formState.passwordConfirm.length > 0 &&
    formState.password !== formState.passwordConfirm;

  const errors = useMemo(
    () => buildAuthFormErrors(formState, isRegisterMode, content.errors),
    [content.errors, formState, isRegisterMode],
  );

  const isFormValid =
    Object.keys(errors).length === 0 && !passwordsMismatch;
  const forgotPasswordErrors = useMemo(
    () => buildForgotPasswordErrors(forgotPasswordState, content.errors),
    [content.errors, forgotPasswordState],
  );
  const isForgotPasswordValid =
    Object.keys(forgotPasswordErrors).length === 0;
  const visibleFormError = useMemo(
    () =>
      findFirstVisibleError<AuthFieldId>(
        isRegisterMode
          ? ["email", "password", "passwordConfirm"]
          : ["email", "password"],
        errors,
        submitted,
        touchedFields,
      ) ?? submitError,
    [errors, isRegisterMode, submitted, submitError, touchedFields],
  );
  const trimmedFamilyCode = normalizeFamilyCodeInput(formState.familyCode);

  const pillInset = 4;
  const segmentCount = content.tabs.length || 1;
  const segmentWidth = tabsWidth
    ? Math.max(0, (tabsWidth - pillInset * 2) / segmentCount)
    : 0;
  const maxIndicatorX = Math.max(0, segmentWidth * (segmentCount - 1));

  const animateContentShift = (nextOffset: number, duration: number) => {
    Animated.timing(contentShiftY, {
      toValue: -nextOffset,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const measureFocusedField = (
    callback: (fieldFrame: FieldFrame | null) => void,
  ) => {
    const fieldId = focusedFieldRef.current;

    if (!fieldId) {
      callback(null);
      return;
    }

    const fieldNode = fieldRefs.current[fieldId];

    if (!fieldNode || typeof fieldNode.measureInWindow !== "function") {
      callback(null);
      return;
    }

    fieldNode.measureInWindow((x, pageY, width, height) => {
      callback({
        pageY,
        height,
      });
    });
  };

  const updateKeyboardOffset = (keyboardHeight: number, duration: number) => {
    keyboardHeightRef.current = keyboardHeight;
    measureFocusedField((fieldFrame) => {
      const { appliedOffset } = resolveKeyboardOffset(
        keyboardHeight,
        isRegisterMode,
        windowHeight,
        fieldFrame,
      );

      animateContentShift(appliedOffset, duration);
    });
  };

  const handleFieldRef =
    (fieldId: LayoutFieldId) => (node: View | null) => {
      fieldRefs.current[fieldId] = node;
    };

  const handleFieldLayout =
    (fieldId: LayoutFieldId) => (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      fieldLayoutsRef.current[fieldId] = { y, height };

      if (
        fieldId === focusedFieldRef.current &&
        keyboardHeightRef.current > 0
      ) {
        updateKeyboardOffset(keyboardHeightRef.current, 120);
      }
    };

  const handleFieldFocus = (fieldId: LayoutFieldId) => {
    focusedFieldRef.current = fieldId;

    if (keyboardHeightRef.current > 0) {
      updateKeyboardOffset(keyboardHeightRef.current, 160);
    }
  };

  const handleSelectTab = (tab: AuthTabKey) => {
    if (isSubmitting) {
      return;
    }

    Keyboard.dismiss();
    setActiveTab(tab);
    setFormStateByTab((current) => ({
      ...current,
      [tab]: { ...initialFormState },
    }));
    setSubmitted(false);
    setSubmitError(null);
    setTouchedFields({});
    setFamilyCodeOpen(false);
    setFamilyCodeError(null);
    setVerifiedFamilyCode(null);
    setIsVerifyingFamilyCode(false);
    setPasswordVisibility(initialPasswordVisibilityState);
    focusedFieldRef.current = null;
    keyboardHeightRef.current = 0;
    scrollOffsetYRef.current = 0;
    fieldLayoutsRef.current = {};
    contentShiftY.setValue(0);
  };

  const handleChangeField = (key: keyof FormState, value: string) => {
    setSubmitError(null);
    if (key === "familyCode") {
      const normalizedValue = normalizeFormValue(key, value);
      if (familyCodeError) {
        setFamilyCodeError(null);
      }
      if (verifiedFamilyCode?.token !== normalizedValue) {
        setVerifiedFamilyCode(resetVerifiedFamilyCode());
      }
    }
    setFormStateByTab((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        [key]: normalizeFormValue(key, value),
      },
    }));
  };

  const verifyFamilyCode = async (tokenOverride?: string) => {
    const token = normalizeFamilyCodeInput(tokenOverride ?? formState.familyCode);
    const verifyError = resolveFamilyCodeVerifyError(
      token,
      content.errors.familyCodeRequiredForPreview,
    );

    if (verifyError) {
      setVerifiedFamilyCode(resetVerifiedFamilyCode());
      setFamilyCodeError(verifyError);
      return null;
    }

    if (verifiedFamilyCode?.token === token) {
      return verifiedFamilyCode;
    }

    setFamilyCodeError(null);
    setIsVerifyingFamilyCode(true);

    try {
      const preview = await fetchFamilyInvitePreview(token);
      const nextVerifiedFamilyCode = buildVerifiedFamilyCode(token, preview);
      setVerifiedFamilyCode(nextVerifiedFamilyCode);
      return nextVerifiedFamilyCode;
    } catch (error) {
      setVerifiedFamilyCode(null);
      setFamilyCodeError(
        getAuthErrorMessage(
          error,
          locale,
          content.familyCodeVerifyFailedError,
        ),
      );
      return null;
    } finally {
      setIsVerifyingFamilyCode(false);
    }
  };

  useEffect(() => {
    if (!isRegisterMode || !familyCodeOpen) {
      return;
    }
    if (!shouldAutoVerifyFamilyCode(trimmedFamilyCode)) {
      return;
    }
    if (verifiedFamilyCode?.token === trimmedFamilyCode || isVerifyingFamilyCode) {
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      setFamilyCodeError(null);
      setIsVerifyingFamilyCode(true);

      fetchFamilyInvitePreview(trimmedFamilyCode)
        .then((preview) => {
          if (cancelled) {
            return;
          }
          setVerifiedFamilyCode(buildVerifiedFamilyCode(trimmedFamilyCode, preview));
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          setVerifiedFamilyCode(null);
          setFamilyCodeError(
            getAuthErrorMessage(
              error,
              locale,
              content.familyCodeVerifyFailedError,
            ),
          );
        })
        .finally(() => {
          if (!cancelled) {
            setIsVerifyingFamilyCode(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [
    content.familyCodeVerifyFailedError,
    familyCodeOpen,
    isRegisterMode,
    locale,
    trimmedFamilyCode,
    verifiedFamilyCode?.token,
  ]);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isFormValid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let inviteToken: string | undefined;

      if (activeTab === "register") {
        const familyCodeSubmitError = resolveFamilyCodeSubmitError(
          trimmedFamilyCode,
          verifiedFamilyCode,
          content.errors.familyCodeNeedsVerification,
        );

        if (familyCodeSubmitError && !shouldAutoVerifyFamilyCode(trimmedFamilyCode)) {
          setFamilyCodeError(familyCodeSubmitError);
          return;
        }

        if (trimmedFamilyCode) {
          const verifiedCode =
            verifiedFamilyCode?.token === trimmedFamilyCode
              ? verifiedFamilyCode
              : await verifyFamilyCode(trimmedFamilyCode);

          if (!verifiedCode) {
            return;
          }

          inviteToken = verifiedCode.token;
        }
      }

      const session =
        activeTab === "login"
          ? await loginWithPassword({
              email: formState.email.trim(),
              password: formState.password,
            })
          : await registerWithPassword({
              email: formState.email.trim(),
              password: formState.password,
              preferredLanguage: toBackendPreferredLanguage(locale),
              inviteToken,
            });

      onAuthenticated(session);
    } catch (error) {
      setSubmitError(
        getAuthErrorMessage(
          error,
          locale,
          activeTab === "login"
            ? content.loginFailedError
            : content.registerFailedError,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    Keyboard.dismiss();
    setForgotPasswordSubmitted(false);
    setForgotPasswordError(null);
    setForgotPasswordState((current) => ({
      ...current,
      email: current.email || formState.email.trim(),
    }));
    requestAnimationFrame(() => {
      setForgotPasswordOpen(true);
    });
  };

  const closeForgotPassword = () => {
    setForgotPasswordOpen(false);
  };

  const handleForgotPasswordSubmit = async () => {
    setForgotPasswordSubmitted(true);
    if (!isForgotPasswordValid) {
      return;
    }

    setForgotPasswordError(null);
    setIsForgotPasswordSubmitting(true);

    try {
      await resetPasswordByRecoveryCode({
        email: forgotPasswordState.email.trim(),
        recoveryCode: forgotPasswordState.recoveryCode,
        newPassword: forgotPasswordState.newPassword,
      });
      setForgotPasswordOpen(false);
    } catch (error) {
      setForgotPasswordError(
        getAuthErrorMessage(
          error,
          locale,
          content.resetPasswordFailedError,
        ),
      );
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  useEffect(() => {
    if (!tabsWidth || isDragging.current) {
      return;
    }

    const targetIndex = content.tabs.findIndex((tab) => tab.key === activeTab);
    Animated.timing(indicatorX, {
      toValue: Math.max(0, targetIndex) * segmentWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeTab, content.tabs, indicatorX, segmentWidth, tabsWidth]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      updateKeyboardOffset(
        event.endCoordinates?.height ?? 0,
        Platform.OS === "ios" ? event.duration ?? 220 : 200,
      );
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      keyboardHeightRef.current = 0;
      Animated.timing(contentShiftY, {
        toValue: 0,
        duration: Platform.OS === "ios" ? event.duration ?? 200 : 180,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [contentShiftY, isRegisterMode, windowHeight]);

  const tabsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        tabsWidth > 0 && Math.abs(gestureState.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        tabsWidth > 0 && Math.abs(gestureState.dx) > 2,
      onPanResponderGrant: () => {
        isDragging.current = false;
        indicatorX.stopAnimation((value) => {
          dragStartX.current = typeof value === "number" ? value : 0;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 2) {
          isDragging.current = true;
        }
        indicatorX.setValue(
          clamp(dragStartX.current + gestureState.dx, 0, maxIndicatorX),
        );
      },
      onPanResponderRelease: (event, gestureState) => {
        const releasedX = isDragging.current
          ? clamp(dragStartX.current + gestureState.dx, 0, maxIndicatorX)
          : clamp(event.nativeEvent.locationX - pillInset, 0, maxIndicatorX);
        const targetIndex = segmentWidth
          ? clamp(Math.round(releasedX / segmentWidth), 0, segmentCount - 1)
          : 0;
        isDragging.current = false;
        handleSelectTab(content.tabs[targetIndex]?.key ?? "login");
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.keyboard,
          { transform: [{ translateY: contentShiftY }] },
        ]}
      >
        <ImageBackground
          source={content.backgroundSource}
          resizeMode="cover"
          style={styles.background}
          imageStyle={styles.backgroundImage as never}
        >
          <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            <View style={styles.screen}>
              <View
                style={[
                  styles.imageSoftener,
                ]}
              />
              <View style={styles.screenScrollContent}>
                <Text style={styles.headlineTop}>
                  {isRegisterMode ? content.registerHeadline : content.loginHeadline}
                </Text>

                <AuthFormCard
                  content={content}
                  activeTab={activeTab}
                  segmentWidth={segmentWidth}
                  indicatorX={indicatorX}
                  tabsPanHandlers={tabsPanResponder.panHandlers}
                  formState={formState}
                  fields={fields}
                  errors={errors}
                  submitted={submitted}
                  touchedFields={touchedFields}
                  visibleFormError={visibleFormError}
                  passwordVisibility={passwordVisibility}
                  familyCodeOpen={familyCodeOpen}
                  verifiedFamilyCode={verifiedFamilyCode}
                  familyCodeError={familyCodeError}
                  isVerifyingFamilyCode={isVerifyingFamilyCode}
                  isRegisterMode={isRegisterMode}
                  isFormValid={isFormValid}
                  isSubmitting={isSubmitting}
                  onTabsLayout={(event) => setTabsWidth(event.nativeEvent.layout.width)}
                  onSelectTab={handleSelectTab}
                  onChangeField={handleChangeField}
                  onFieldFocus={handleFieldFocus}
                  onFieldBlur={(fieldId) => {
                    focusedFieldRef.current = null;
                    setTouchedFields((current) => ({
                      ...current,
                      [fieldId]: true,
                    }));
                  }}
                  onFamilyCodeBlur={() => {
                    focusedFieldRef.current = null;
                  }}
                  onTogglePasswordVisibility={(fieldId) =>
                    setPasswordVisibility((current) => ({
                      ...current,
                      [fieldId]: !current[fieldId as keyof PasswordVisibilityState],
                    }))
                  }
                  onToggleFamilyCodeOpen={() => setFamilyCodeOpen((current) => !current)}
                  onSubmit={handleSubmit}
                  onOpenForgotPassword={openForgotPassword}
                  getFieldRef={handleFieldRef}
                  getFieldLayout={handleFieldLayout}
                />

                <AuthBottomArea
                  showLegal
                  supportLabel={content.supportLabel}
                  termsLabel={content.legalConsentTermsLabel}
                  privacyLabel={content.legalConsentPrivacyLabel}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ImageBackground>
      </Animated.View>

      <FormBottomSheet
        visible={forgotPasswordOpen}
        onClose={closeForgotPassword}
        overlayStyle={styles.sheetOverlay}
        backdropStyle={styles.sheetBackdrop}
        sheetStyle={styles.forgotPasswordSheetCard}
        keyboardAvoiding
        keyboardBehavior="padding"
        keyboardVerticalOffset={0}
      >
        {({ panHandlers }) => (
          <ForgotPasswordSheetContent
            content={content}
            panHandlers={panHandlers}
            forgotPasswordState={forgotPasswordState}
            forgotPasswordVisibility={forgotPasswordVisibility}
            forgotPasswordSubmitted={forgotPasswordSubmitted}
            forgotPasswordTouched={forgotPasswordTouched}
            forgotPasswordErrors={forgotPasswordErrors}
            forgotPasswordError={forgotPasswordError}
            isForgotPasswordValid={isForgotPasswordValid}
            isForgotPasswordSubmitting={isForgotPasswordSubmitting}
            onChangeEmail={(next) => {
              setForgotPasswordError(null);
              setForgotPasswordState((current) => ({
                ...current,
                email: next,
              }));
            }}
            onChangeRecoveryCode={(next) => {
              setForgotPasswordError(null);
              setForgotPasswordState((current) => ({
                ...current,
                recoveryCode: normalizeRecoveryCode(next),
              }));
            }}
            onChangeNewPassword={(next) => {
              setForgotPasswordError(null);
              setForgotPasswordState((current) => ({
                ...current,
                newPassword: next,
              }));
            }}
            onChangePasswordConfirm={(next) => {
              setForgotPasswordError(null);
              setForgotPasswordState((current) => ({
                ...current,
                passwordConfirm: next,
              }));
            }}
            onToggleNewPasswordVisibility={() =>
              setForgotPasswordVisibility((current) => ({
                ...current,
                newPassword: !current.newPassword,
              }))
            }
            onTogglePasswordConfirmVisibility={() =>
              setForgotPasswordVisibility((current) => ({
                ...current,
                passwordConfirm: !current.passwordConfirm,
              }))
            }
            onBlurField={(fieldId) =>
              setForgotPasswordTouched((current) => ({
                ...current,
                [fieldId]: true,
              }))
            }
            onSubmit={handleForgotPasswordSubmit}
          />
        )}
      </FormBottomSheet>
    </View>
  );
}
