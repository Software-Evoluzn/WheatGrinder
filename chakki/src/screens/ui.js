// =============================================================================
//  UI KIT  —  reusable, token-driven components used across every screen
// -----------------------------------------------------------------------------
//  These are presentational only. They never own navigation or business logic;
//  screens pass in handlers/state. Import what you need:
//     import { Screen, AppHeader, PrimaryButton, StatusView } from './ui';
// -----------------------------------------------------------------------------
//  MERGED (Developer 1 + Developer 2):
//    • Developer 1 — responsive layer (useResponsive) + new shared components
//      (ResponsiveText, ResponsiveContainer, AppFooter/PoweredByEvoluzn,
//       BrandLogo, ScreenWrapper, CommonHeader).
//    • Developer 2 — per-component style-override props (color/style/buttonStyle,
//       iconColor, backButtonStyle, fillColor) + GREEN primary/solid-pill color.
//    Both sets of changes are preserved. See notes marked [MERGE].
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  motion,
  layout,
  statusPalette,
  moderateScale,
  scaleSize,
  guidelineBaseWidth,
} from './theme';

/* -------------------------------------------------------------------------- */
/*  useResponsive — single hook every screen can use for window-aware sizing    */
/*    Re-renders on rotation / split-screen because it reads useWindowDimensions*/
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
export const BREAKPOINTS = { small: 360, large: 600 };

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isSmall = width < BREAKPOINTS.small;   // compact phones (e.g. 320–359pt)
  const isLarge = width >= BREAKPOINTS.large;  // large phones / tablets
  return {
    width,
    height,
    isSmall,
    isLarge,
    isPortrait: height >= width,
    // % of width / height — handy for fluid sizing without magic pixels
    wp: (pct) => Math.round((width * pct) / 100),
    hp: (pct) => Math.round((height * pct) / 100),
    // scale a design value against the real device width
    scale: (size) => scaleSize(size, width),
    // moderate scale — best for font sizes
    ms: (size, factor = 0.5) => moderateScale(size, width, factor),
  };
};

/* -------------------------------------------------------------------------- */
/*  Screen — consistent safe-area + status-bar wrapper                          */
/* -------------------------------------------------------------------------- */
export const Screen = ({
  children,
  style,
  background = colors.background,
  edges = ['top', 'left', 'right'],
  barStyle = 'dark-content',
}) => (
  <SafeAreaView style={[{ flex: 1, backgroundColor: background }, style]} edges={edges}>
    <StatusBar barStyle={barStyle} backgroundColor={background} />
    {children}
  </SafeAreaView>
);

/* -------------------------------------------------------------------------- */
/*  Eyebrow / SectionHeader — small labels above content                       */
/* -------------------------------------------------------------------------- */
export const Eyebrow = ({ children, color = colors.primary, style }) => (
  <Text style={[styles.eyebrow, { color }, style]}>{String(children).toUpperCase()}</Text>
);

export const SectionHeader = ({ title, subtitle, style }) => (
  <View style={[{ marginBottom: spacing.lg }, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

/* -------------------------------------------------------------------------- */
/*  IconButton — [MERGE] Developer 2's signature: adds color / style /         */
/*  buttonStyle overrides on top of Developer 1's icon button.                 */
/* -------------------------------------------------------------------------- */
export const IconButton = ({
  name,
  onPress,
  variant = 'ghost',
  size = 20,
  color,
  accessibilityLabel,
  style,
  buttonStyle,
}) => {
  const isSolid = variant === 'solid';
  const iconColor = color || (isSolid ? colors.iconOnPrimary : colors.primary);
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || name}
        style={({ pressed }) => [
          styles.iconBtn,
          isSolid ? styles.iconBtnSolid : styles.iconBtnGhost,
          buttonStyle,
          pressed && { opacity: 0.75 },
        ]}
      >
        <Feather name={name} size={size} color={iconColor} />
      </Pressable>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  AppHeader — back button + centered title/subtitle + optional right slot     */
/*    [MERGE] keeps Developer 2's backButtonStyle prop.                         */
/* -------------------------------------------------------------------------- */
export const AppHeader = ({ title, subtitle, onBack, backButtonStyle, right, align = 'center' }) => (
  <View style={styles.header}>
    {onBack ? (
      <IconButton
        name="arrow-left"
        onPress={onBack}
        variant="solid"
        size={20}
        buttonStyle={backButtonStyle}
        accessibilityLabel="Go back"
      />
    ) : (
      <View style={styles.headerSpacer} />
    )}
    <View style={[styles.headerTitleWrap, { alignItems: align === 'left' ? 'flex-start' : 'center' }]}>
      {!!title && <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>}
      {!!subtitle && <Text numberOfLines={1} style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
    {right || <View style={styles.headerSpacer} />}
  </View>
);

/* -------------------------------------------------------------------------- */
/*  StepIndicator — dots for setup / onboarding wizards                         */
/* -------------------------------------------------------------------------- */
export const StepIndicator = ({ total = 3, current = 0, style }) => (
  <View style={[styles.stepRow, style]}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i === current && styles.stepDotActive,
          i < current && styles.stepDotDone,
        ]}
      />
    ))}
  </View>
);

/* -------------------------------------------------------------------------- */
/*  Buttons — one consistent language, animated press feedback                  */
/* -------------------------------------------------------------------------- */
const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.timing(scale, {
      toValue: v,
      duration: motion.duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  return { scale, onPressIn: () => to(motion.press.scaleDown), onPressOut: () => to(1) };
};

/* [MERGE] Developer 2's PrimaryButton: adds iconColor + buttonStyle overrides. */
export const PrimaryButton = ({
  title,
  onPress,
  icon,
  iconColor,
  iconRight = true,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  buttonStyle,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const isDisabled = disabled || loading;
  const resolvedIconColor = iconColor || colors.textOnPrimary;
  return (
    <Animated.View style={[fullWidth && { alignSelf: 'stretch' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.btnBase,
          styles.btnPrimary,
          buttonStyle,
          isDisabled && styles.btnPrimaryDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <View style={styles.btnContent}>
            {icon && !iconRight && (
              <Feather
                name={icon}
                size={18}
                color={resolvedIconColor}
                style={{ marginRight: spacing.sm }}
              />
            )}
            <Text style={styles.btnPrimaryText}>{title}</Text>
            {icon && iconRight && (
              <Feather
                name={icon}
                size={18}
                color={resolvedIconColor}
                style={{ marginLeft: spacing.sm }}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

/* [MERGE] Developer 2's SecondaryButton: adds buttonStyle override. */
export const SecondaryButton = ({ title, onPress, icon, disabled = false, fullWidth = true, style, buttonStyle }) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Animated.View style={[fullWidth && { alignSelf: 'stretch' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        style={[styles.btnBase, styles.btnSecondary, buttonStyle, disabled && { opacity: 0.5 }]}
      >
        <View style={styles.btnContent}>
          {icon && <Feather name={icon} size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />}
          <Text style={styles.btnSecondaryText}>{title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  PillButton — compact rounded action (e.g. "Add Product" in a header)        */
/*    [MERGE] keeps Developer 2's buttonStyle override.                         */
/* -------------------------------------------------------------------------- */
export const PillButton = ({
  title,
  onPress,
  icon = 'plus',
  variant = 'solid',
  style,
  buttonStyle,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const isSolid = variant === 'solid';
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[
          styles.pillBtn,
          isSolid ? styles.pillBtnSolid : styles.pillBtnGhost,
          buttonStyle,
        ]}
      >
        {!!icon && (
          <Feather
            name={icon}
            size={16}
            color={isSolid ? colors.textOnPrimary : colors.primary}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[styles.pillBtnText, !isSolid && { color: colors.primary }]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  Card & SelectableCard                                                       */
/* -------------------------------------------------------------------------- */
export const Card = ({ children, style, padded = true }) => (
  <View style={[styles.card, padded && { padding: spacing.xl }, style]}>{children}</View>
);

export const SelectableCard = ({ selected, onPress, icon, label, style }) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Animated.View style={[{ flex: 1, transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        style={[styles.selCard, selected && styles.selCardActive]}
      >
        {!!icon && (
          <View style={[styles.selIconChip, selected && styles.selIconChipActive]}>
            <Feather name={icon} size={26} color={selected ? colors.textOnPrimary : colors.primary} />
          </View>
        )}
        <Text style={[styles.selLabel, selected && styles.selLabelActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  StatusBadge — small pill for live state                                     */
/* -------------------------------------------------------------------------- */
export const StatusBadge = ({ label, variant = 'info', icon, style }) => {
  const p = statusPalette[variant] || statusPalette.info;
  return (
    <View style={[styles.badge, { backgroundColor: p.tint }, style]}>
      {!!icon && <Feather name={icon} size={13} color={p.color} style={{ marginRight: 6 }} />}
      <Text style={[styles.badgeText, { color: p.color }]}>{label}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  StatusIcon — big circular icon chip tinted by variant                      */
/* -------------------------------------------------------------------------- */
export const StatusIcon = ({ icon, variant = 'info', size = 96 }) => {
  const p = statusPalette[variant] || statusPalette.info;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: p.tint,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: p.border,
      }}
    >
      <Feather name={icon} size={size * 0.42} color={p.color} />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  StatusView — the canonical layout for status / warning / prompt screens     */
/*    icon chip -> title -> supporting text -> (children: actions/hints)         */
/* -------------------------------------------------------------------------- */
export const StatusView = ({ icon, variant = 'info', title, message, children, iconNode }) => (
  <View style={styles.statusWrap}>
    {iconNode || <StatusIcon icon={icon} variant={variant} />}
    {!!title && <Text style={styles.statusTitle}>{title}</Text>}
    {!!message && <Text style={styles.statusMessage}>{message}</Text>}
    {children ? <View style={styles.statusActions}>{children}</View> : null}
  </View>
);

/* -------------------------------------------------------------------------- */
/*  Spinner — brand-purple rotating ring (looping)                              */
/* -------------------------------------------------------------------------- */
export const Spinner = ({ size = 88, icon, emoji }) => {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const border = Math.max(3, Math.round(size * 0.045));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: colors.primaryTintBorder,
          borderTopColor: colors.primary,
          transform: [{ rotate: spin }],
        }}
      />
      {(icon || emoji) && (
        <View
          style={{
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            backgroundColor: colors.primaryTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon ? <Feather name={icon} size={size * 0.28} color={colors.primary} /> : <Text style={{ fontSize: size * 0.26 }}>{emoji}</Text>}
        </View>
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  ProgressBar — animated brand fill                                           */
/*    [MERGE] keeps Developer 2's fillColor override.                           */
/* -------------------------------------------------------------------------- */
export const ProgressBar = ({ value = 0, height = 44, showLabel = true, fillColor, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, value)),
      duration: motion.duration.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.progressFill,
          { width, borderRadius: height / 2 },
          fillColor && { backgroundColor: fillColor },
        ]}
      />
      {showLabel && <Text style={styles.progressLabel}>{Math.round(value)}%</Text>}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  Toggle — animated NO / YES pill (brand purple when on)                      */
/*    Controlled: pass `value` + `onValueChange`. Screen keeps owning state.    */
/* -------------------------------------------------------------------------- */
export const Toggle = ({ value, onValueChange, labels = ['NO', 'YES'], style }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: motion.duration.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [4, 52] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderStrong, colors.primary],
  });

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Pressable
        onPress={() => onValueChange && onValueChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: !!value }}
        hitSlop={8}
      >
        <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
          <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
        </Animated.View>
      </Pressable>
      <View style={styles.toggleLabels}>
        <Text style={[styles.toggleLabel, !value && styles.toggleLabelActive]}>{labels[0]}</Text>
        <Text style={[styles.toggleLabel, value && styles.toggleLabelActive]}>{labels[1]}</Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  EmptyState & LoadingState                                                   */
/* -------------------------------------------------------------------------- */
export const EmptyState = ({ icon = 'inbox', title, message, children }) => (
  <View style={styles.statusWrap}>
    <StatusIcon icon={icon} variant="info" />
    {!!title && <Text style={styles.statusTitle}>{title}</Text>}
    {!!message && <Text style={styles.statusMessage}>{message}</Text>}
    {children ? <View style={styles.statusActions}>{children}</View> : null}
  </View>
);

export const LoadingState = ({ message = 'Please wait…' }) => (
  <View style={styles.statusWrap}>
    <Spinner size={72} />
    <Text style={[styles.statusTitle, { marginTop: spacing.xxl }]}>{message}</Text>
  </View>
);

/* -------------------------------------------------------------------------- */
/*  MainHeader — primary app screens (Home / Settings / Product Reg.)           */
/*    [MERGE] keeps Developer 2's backButtonStyle prop.                         */
/* -------------------------------------------------------------------------- */
export const MainHeader = ({
  title,
  greeting,
  onAction,
  actionIcon = 'user',
  right,
  leadingIcon,
  onBack,
  backButtonStyle,
  style,
}) => (
  <View style={[styles.mainHeader, style]}>
    {onBack && (
      <View style={{ marginRight: spacing.md }}>
        <IconButton
          name="arrow-left"
          onPress={onBack}
          variant="solid"
          size={20}
          buttonStyle={backButtonStyle}
          accessibilityLabel="Go back"
        />
      </View>
    )}
    <View style={styles.mainHeaderLeft}>
      {!!leadingIcon && (
        <View style={[styles.headerLeadChip, { marginRight: spacing.md }]}>
          <Feather name={leadingIcon} size={20} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        {!!greeting && <Text style={styles.mainGreeting}>{String(greeting).toUpperCase()}</Text>}
        {!!title && <Text numberOfLines={1} style={styles.mainTitle}>{title}</Text>}
      </View>
    </View>
    <View style={styles.mainRightSlot}>
      {right !== undefined ? (
        right
      ) : (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionIcon}
          style={({ pressed }) => [styles.mainAction, pressed && { opacity: 0.85 }]}
        >
          <Feather name={actionIcon} size={18} color={colors.iconOnPrimary} />
        </Pressable>
      )}
    </View>
  </View>
);

/* -------------------------------------------------------------------------- */
/*  SetupHeader — contextual header for setup / operation screens              */
/*    back + centered title/subtitle + optional "2/6" step pill + progress line */
/*    [MERGE] keeps Developer 2's backButtonStyle prop.                         */
/* -------------------------------------------------------------------------- */
export const SetupHeader = ({
  title,
  subtitle,
  onBack,
  backButtonStyle,
  step,
  totalSteps,
  right,
  showProgress = true,
  leadingIcon,
}) => {
  const hasSteps = typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0;
  const pct = hasSteps ? Math.max(0, Math.min(1, step / totalSteps)) : 0;
  // With no back button, a leading icon chip + left-aligned title fills the row
  // intentionally instead of leaving empty space around a centered title.
  const leftAligned = !!leadingIcon && !onBack;
  return (
    <View style={styles.setupHeaderWrap}>
      <View style={styles.setupHeaderRow}>
        {onBack ? (
          <IconButton
            name="arrow-left"
            onPress={onBack}
            variant="solid"
            size={20}
            buttonStyle={backButtonStyle}
            accessibilityLabel="Go back"
          />
        ) : leadingIcon ? (
          <View style={styles.headerLeadChip}>
            <Feather name={leadingIcon} size={20} color={colors.primary} />
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <View style={[styles.setupHeaderTitleWrap, leftAligned && styles.setupHeaderTitleLeft]}>
          {!!title && <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>}
          {!!subtitle && <Text numberOfLines={1} style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        {right !== undefined ? (
          right
        ) : hasSteps ? (
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{step}/{totalSteps}</Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      {hasSteps && showProgress && (
        <View style={styles.setupTrack}>
          <View style={[styles.setupTrackFill, { width: `${pct * 100}%` }]} />
        </View>
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  BottomActionBar — fixed, safe-area-aware action area                        */
/*    Styles ONLY the actions a screen already has. Pass buttons as children.   */
/* -------------------------------------------------------------------------- */
export const BottomActionBar = ({ children, divider = true, lift = 80, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomBar,
        divider && styles.bottomBarDivider,
        { paddingBottom: Math.max(insets.bottom, spacing.lg) + lift },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  ScreenContainer — Screen + standard horizontal content padding             */
/*    Gives every screen the same rhythm without re-declaring paddings.         */
/* -------------------------------------------------------------------------- */
export const ScreenContainer = ({ children, background, edges, barStyle, contentStyle, padded = true }) => (
  <Screen background={background} edges={edges} barStyle={barStyle}>
    <View style={[{ flex: 1 }, padded && { paddingHorizontal: layout.screenPaddingHorizontal }, contentStyle]}>
      {children}
    </View>
  </Screen>
);

/* -------------------------------------------------------------------------- */
/*  AppDialog — themed, branded modal dialog (replaces default Alert popups)    */
/*    Presentation only. Pass visible + handlers; screen owns the state.        */
/* -------------------------------------------------------------------------- */
export const AppDialog = ({
  visible,
  onClose,
  icon,
  title,
  message,
  confirmLabel = 'OK',
  onConfirm,
  cancelLabel,
  onCancel,
}) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={styles.dialogOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={styles.dialogCard}>
        {!!icon && (
          <View style={styles.dialogIcon}>
            <Feather name={icon} size={24} color={colors.primary} />
          </View>
        )}
        {!!title && <Text style={styles.dialogTitle}>{title}</Text>}
        {!!message && <Text style={styles.dialogMessage}>{message}</Text>}
        <View style={styles.dialogActions}>
          {!!cancelLabel && (
            <SecondaryButton title={cancelLabel} onPress={onCancel} style={{ flex: 1 }} />
          )}
          <PrimaryButton title={confirmLabel} onPress={onConfirm} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  </Modal>
);

/* -------------------------------------------------------------------------- */
/*  Footer note helper                                                          */
/* -------------------------------------------------------------------------- */
export const FootNote = ({ children, style }) => (
  <Text style={[styles.footNote, style]}>{children}</Text>
);

/* -------------------------------------------------------------------------- */
/*  ResponsiveText — font size scales (moderately) with the device width        */
/*    Pass `size` as the design value; it clamps so it stays readable.          */
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
export const ResponsiveText = ({ size = 14, weight, color, style, children, ...rest }) => {
  const { ms } = useResponsive();
  return (
    <Text
      style={[
        { fontSize: ms(size) },
        weight && { fontWeight: weight },
        color && { color },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

/* -------------------------------------------------------------------------- */
/*  ResponsiveContainer — centers + caps content width on large screens         */
/*    Phones get full width; tablets / large phones stop stretching at maxWidth.*/
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
export const ResponsiveContainer = ({ children, maxWidth = 560, style }) => (
  <View style={[styles.responsiveContainer, style]}>
    <View style={{ width: '100%', maxWidth, flex: 1 }}>{children}</View>
  </View>
);

/* -------------------------------------------------------------------------- */
/*  AppFooter (CommonFooter) — the one "Powered by EVOLUZN" footer              */
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
/*  Replaces every hand-rolled footer. It is safe-area aware: on Android three- */
/*  button navigation it sits ABOVE the system nav bar (never behind it).       */
/*                                                                              */
/*    variant="light"  -> for light/surface backgrounds (muted purple text)     */
/*    variant="onDark" -> for the brand-purple backgrounds (white text)         */
/*    inline           -> set when the footer is already inside a ScrollView /   */
/*                        padded content; then it adds NO safe-area padding      */
/*                        because the scroll/parent already clears the nav bar.  */
/* -------------------------------------------------------------------------- */
export const AppFooter = ({ variant = 'light', inline = false, row = false, style }) => {
  const insets = useSafeAreaInsets();
  const onDark = variant === 'onDark';
  const paddingBottom = inline ? spacing.lg : Math.max(insets.bottom, spacing.md) + spacing.sm;

  // Single-line variant: "POWERED BY EVOLUZN" on one row, never wrapping.
  if (row) {
    return (
      <View style={[styles.footer, { paddingBottom }, style]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.footerRowText}
        >
          <Text style={[styles.footerEyebrow, onDark ? styles.footerEyebrowDark : null]}>
            POWERED BY{' '}
          </Text>
          <Text style={[styles.footerBrandInline, onDark ? styles.footerBrandDark : null]}>
            EVOLUZN
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.footer, { paddingBottom }, style]}>
      <Text style={[styles.footerEyebrow, onDark ? styles.footerEyebrowDark : null]}>
        POWERED BY
      </Text>
      <Text style={[styles.footerBrand, onDark ? styles.footerBrandDark : null]}>
        EVOLUZN
      </Text>
    </View>
  );
};
// Aliases so screens can import whichever name reads best.
export const CommonFooter = AppFooter;
// Single-line "POWERED BY EVOLUZN" by default — the one shared brand footer.
export const PoweredByEvoluzn = (props) => <AppFooter row {...props} />;

/* -------------------------------------------------------------------------- */
/*  BrandLogo — one responsive logo used everywhere (splash / card / header)    */
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
/*  Sizes as a % of screen width with min/max caps, aspectRatio from the image, */
/*  and resizeMode="contain" so it never distorts. variant sets the width band. */
/*  Pass your own `source` + `ratio` (width/height of the asset).               */
/*  NOTE: the Softel logo's require() path + styling live in the SCREENS that    */
/*  pass `source`/`style` here — this component was left untouched by the merge. */
/* -------------------------------------------------------------------------- */
export const BRAND_LOGO_VARIANTS = {
  // widthPct of screen, clamped between min and max (device-independent)
  splash: { widthPct: 0.82, min: 230, max: 360 },
  card: { widthPct: 0.84, min: 220, max: 340 },
  header: { widthPct: 0.62, min: 200, max: 300 },
};

export const BrandLogo = ({ source, ratio, variant = 'header', style, ...rest }) => {
  const { width } = useResponsive();
  const v = BRAND_LOGO_VARIANTS[variant] || BRAND_LOGO_VARIANTS.header;
  const w = Math.round(clampNumLocal(width * v.widthPct, v.min, v.max));

  // true ratio from the asset; fall back to the prop
  const asset = Image.resolveAssetSource(source);
  const r = asset?.width && asset?.height ? asset.width / asset.height : (ratio || 180 / 48);

  return (
    <View style={[{ width: w, height: Math.round(w / r), overflow: 'hidden' }, style]}>
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: '100%', height: '100%' }}
        {...rest}
      />
    </View>
  );
};
const clampNumLocal = (val, min, max) => Math.min(Math.max(val, min), max);

/* -------------------------------------------------------------------------- */
/*  ScreenWrapper — the canonical screen shell                                  */
/*    [Developer 1]                                                             */
/* -------------------------------------------------------------------------- */
/*  Safe-area + status bar + standard horizontal padding + optional branded     */
/*  footer pinned above the system nav bar + optional scroll/keyboard handling. */
/*  Use this for new screens so header / content / footer follow one standard.  */
/*                                                                              */
/*    footer      -> true | 'light' | 'onDark' to render the AppFooter          */
/*    scroll      -> wrap children in a ScrollView (keyboard-friendly forms)     */
/*    center      -> vertically center non-scrolling content                    */
/* -------------------------------------------------------------------------- */
export const ScreenWrapper = ({
  children,
  background = colors.background,
  barStyle = 'dark-content',
  padded = true,
  footer = false,
  scroll = false,
  center = false,
  edges,
  contentStyle,
  style,
}) => {
  // When a footer is shown we own the bottom inset via AppFooter, so the
  // SafeAreaView should not also pad the bottom (that would double it up).
  const resolvedEdges = edges || (footer ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']);
  const footerVariant = footer === 'onDark' ? 'onDark' : 'light';
  const padStyle = padded && { paddingHorizontal: layout.screenPaddingHorizontal };

  const inner = scroll ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { flexGrow: 1 },
          padStyle,
          center && { justifyContent: 'center' },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={[{ flex: 1 }, padStyle, center && { justifyContent: 'center' }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: background }, style]} edges={resolvedEdges}>
      <StatusBar barStyle={barStyle} backgroundColor={background} />
      {inner}
      {footer ? <AppFooter variant={footerVariant} /> : null}
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/*  CommonHeader — single import name for the shared headers                     */
/*    [Developer 1]                                                             */
/*    Defaults to the back + centered-title AppHeader. Pass variant="main" for  */
/*    the primary-screen header or variant="setup" for the setup/progress one.  */
/*    [MERGE] passes through Developer 2's extra props (backButtonStyle, etc.)   */
/*    because it spreads ...props straight into the chosen header.               */
/* -------------------------------------------------------------------------- */
export const CommonHeader = ({ variant = 'default', ...props }) => {
  if (variant === 'main') return <MainHeader {...props} />;
  if (variant === 'setup') return <SetupHeader {...props} />;
  return <AppHeader {...props} />;
};

/* ========================================================================== */
const androidTopPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const styles = StyleSheet.create({
  eyebrow: { ...typography.eyebrow, color: colors.primary },
  sectionTitle: { ...typography.title, color: colors.textPrimary },
  sectionSubtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.headerContentHeight,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  headerTitleWrap: { flex: 1, paddingHorizontal: spacing.md },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2, letterSpacing: 0.3 },
  headerSpacer: { width: layout.minTouchTarget, height: layout.minTouchTarget },

  /* Icon button */
  iconBtn: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSolid: { backgroundColor: colors.primary, ...shadows.button },
  iconBtnGhost: { backgroundColor: colors.primaryTint },

  /* Step indicator */
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryTintBorder },
  stepDotActive: { width: 22, backgroundColor: colors.primary },
  stepDotDone: { backgroundColor: colors.primary },

  /* Buttons */
  btnBase: {
    minHeight: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // [MERGE — CONFLICT RESOLVED] GREEN: main action/navigation buttons (Developer 2).
  // Original was colors.primary (purple); Developer 2 deliberately changed it.
  btnPrimary: { backgroundColor: '#7DC24D', ...shadows.button },

  btnPrimaryDisabled: { backgroundColor: colors.disabledBg, shadowOpacity: 0, elevation: 0 },
  btnPrimaryText: {
  ...typography.button,
  fontSize: 18,
  fontWeight: '800',
  color: colors.textOnPrimary,
},

  // Original secondary button colour retained (both developers agree).
  btnSecondary: { backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primaryTintBorder },
  btnSecondaryText: { ...typography.button, color: colors.primary },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  /* Pill button */
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },

  // [MERGE — CONFLICT RESOLVED] GREEN: solid pill actions such as Add Product (Developer 2).
  pillBtnSolid: { backgroundColor: '#7DC24D', ...shadows.button },

  // Original ghost pill colour retained (both developers agree).
  pillBtnGhost: { backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: colors.primaryTintBorder },
  pillBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, color: colors.textOnPrimary },

  /* Selectable card */
  selCard: {
    minHeight: 150,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    ...shadows.subtle,
  },
  selCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  selIconChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  selIconChipActive: { backgroundColor: colors.primary },
  selLabel: { fontSize: 15, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1, textAlign: 'center' },
  selLabelActive: { color: colors.primary },

  /* Badge */
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  /* Status view */
  statusWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  statusTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xxl, letterSpacing: 0.2 },
  statusMessage: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 22, maxWidth: 320 },
  statusActions: { marginTop: spacing.xxxl, alignSelf: 'stretch', alignItems: 'center', gap: spacing.md },

  /* Progress */
  progressTrack: { width: '100%', backgroundColor: colors.primarySubtle, justifyContent: 'center', overflow: 'hidden' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primary },
  progressLabel: { position: 'absolute', right: 16, fontSize: 13, fontWeight: '800', color: colors.textOnPrimary },

  /* Toggle */
  toggleTrack: { width: 100, height: 52, borderRadius: 26, justifyContent: 'center', padding: 4 },
  toggleThumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, ...shadows.subtle },
  toggleLabels: { flexDirection: 'row', justifyContent: 'space-between', width: 96, marginTop: spacing.md, paddingHorizontal: 6 },
  toggleLabel: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 },
  toggleLabelActive: { color: colors.primary },

  /* Main header (primary screens) */
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.headerContentHeight,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  mainGreeting: { ...typography.eyebrow, color: colors.primary, marginBottom: 2 },
  mainHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mainRightSlot: {
    minWidth: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  mainTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  mainAction: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },

  /* Setup / contextual header */
  setupHeaderWrap: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  setupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.headerContentHeight,
  },
  setupHeaderTitleWrap: { flex: 1, paddingHorizontal: spacing.md, alignItems: 'center' },
  setupHeaderTitleLeft: { alignItems: 'flex-start' },
  headerLeadChip: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    minWidth: layout.minTouchTarget,
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  setupTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primarySubtle,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  setupTrackFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },

  /* Bottom action bar */
  bottomBar: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  bottomBarDivider: { borderTopWidth: 1, borderTopColor: colors.divider },

  /* Footer */
  footNote: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },

  /* Branded app footer (Powered by EVOLUZN) — [Developer 1] */
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  footerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
  },
  footerEyebrowDark: { color: '#A295C4' },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
    marginTop: 3,
  },
  // Inline (single-line) brand word — no marginTop so it stays on the same row.
  footerBrandInline: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  footerRowText: { textAlign: 'center' },
  footerBrandDark: { color: colors.textOnPrimary },

  /* Responsive container — [Developer 1] */
  responsiveContainer: { flex: 1, width: '100%', alignItems: 'center' },

  /* Dialog */
  dialogOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    ...shadows.card,
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: spacing.sm,
  },
  dialogMessage: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

export default {
  Screen,
  ScreenContainer,
  AppHeader,
  MainHeader,
  SetupHeader,
  BottomActionBar,
  IconButton,
  Eyebrow,
  SectionHeader,
  StepIndicator,
  PrimaryButton,
  SecondaryButton,
  PillButton,
  Card,
  SelectableCard,
  StatusBadge,
  StatusIcon,
  StatusView,
  Spinner,
  ProgressBar,
  Toggle,
  AppDialog,
  EmptyState,
  LoadingState,
  FootNote,
  // [Developer 1] additions:
  AppFooter,
  CommonFooter,
  PoweredByEvoluzn,
  BrandLogo,
  ScreenWrapper,
  ResponsiveContainer,
  ResponsiveText,
  CommonHeader,
  useResponsive,
};