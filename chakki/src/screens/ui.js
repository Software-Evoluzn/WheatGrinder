// =============================================================================
//  UI KIT  —  reusable, token-driven components used across every screen
// -----------------------------------------------------------------------------
//  These are presentational only. They never own navigation or business logic;
//  screens pass in handlers/state. Import what you need:
//     import { Screen, AppHeader, PrimaryButton, StatusView } from './ui';
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
} from './theme';

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
/*  AppHeader — back button + centered title/subtitle + optional right slot     */
/* -------------------------------------------------------------------------- */
export const IconButton = ({ name, onPress, variant = 'ghost', size = 20, accessibilityLabel }) => {
  const isSolid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
      style={({ pressed }) => [
        styles.iconBtn,
        isSolid ? styles.iconBtnSolid : styles.iconBtnGhost,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Feather name={name} size={size} color={isSolid ? colors.iconOnPrimary : colors.primary} />
    </Pressable>
  );
};

export const AppHeader = ({ title, subtitle, onBack, right, align = 'center' }) => (
  <View style={styles.header}>
    {onBack ? (
      <IconButton name="arrow-left" onPress={onBack} variant="solid" size={20} accessibilityLabel="Go back" />
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

export const PrimaryButton = ({
  title,
  onPress,
  icon,
  iconRight = true,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const isDisabled = disabled || loading;
  return (
    <Animated.View style={[fullWidth && { alignSelf: 'stretch' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[styles.btnBase, styles.btnPrimary, isDisabled && styles.btnPrimaryDisabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <View style={styles.btnContent}>
            {icon && !iconRight && <Feather name={icon} size={18} color={colors.textOnPrimary} style={{ marginRight: spacing.sm }} />}
            <Text style={styles.btnPrimaryText}>{title}</Text>
            {icon && iconRight && <Feather name={icon} size={18} color={colors.textOnPrimary} style={{ marginLeft: spacing.sm }} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const SecondaryButton = ({ title, onPress, icon, disabled = false, fullWidth = true, style }) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Animated.View style={[fullWidth && { alignSelf: 'stretch' }, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        style={[styles.btnBase, styles.btnSecondary, disabled && { opacity: 0.5 }]}
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
/*  ProgressBar — animated, brand-purple fill                                   */
/* -------------------------------------------------------------------------- */
export const ProgressBar = ({ value = 0, height = 44, showLabel = true, style }) => {
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
      <Animated.View style={[styles.progressFill, { width, borderRadius: height / 2 }]} />
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
/*    left: optional greeting eyebrow + title   right: optional round action    */
/* -------------------------------------------------------------------------- */
export const MainHeader = ({ title, greeting, onAction, actionIcon = 'user', right, leadingIcon, onBack, style }) => (
  <View style={[styles.mainHeader, style]}>
    {onBack && (
      <View style={{ marginRight: spacing.md }}>
        <IconButton name="arrow-left" onPress={onBack} variant="solid" size={20} accessibilityLabel="Go back" />
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
/*    Progress is purely visual; pass step/totalSteps you already know.         */
/* -------------------------------------------------------------------------- */
export const SetupHeader = ({ title, subtitle, onBack, step, totalSteps, right, showProgress = true, leadingIcon }) => {
  const hasSteps = typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0;
  const pct = hasSteps ? Math.max(0, Math.min(1, step / totalSteps)) : 0;
  // With no back button, a leading icon chip + left-aligned title fills the row
  // intentionally instead of leaving empty space around a centered title.
  const leftAligned = !!leadingIcon && !onBack;
  return (
    <View style={styles.setupHeaderWrap}>
      <View style={styles.setupHeaderRow}>
        {onBack ? (
          <IconButton name="arrow-left" onPress={onBack} variant="solid" size={20} accessibilityLabel="Go back" />
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
export const BottomActionBar = ({ children, divider = true, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomBar,
        divider && styles.bottomBarDivider,
        { paddingBottom: Math.max(insets.bottom, spacing.lg) },
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
  btnPrimary: { backgroundColor: colors.primary, ...shadows.button },
  btnPrimaryDisabled: { backgroundColor: colors.disabledBg, shadowOpacity: 0, elevation: 0 },
  btnPrimaryText: { ...typography.button, color: colors.textOnPrimary },
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
};