import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Modal, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  MainHeader,
  IconButton,
  Eyebrow,
  ProgressBar,
  StatusBadge,
  AppDialog,
} from './ui';
import { colors, spacing, typography, radii, shadows, layout } from './theme';

const PROGRESS_STEP = 10;        // % added per tick
const PROGRESS_INTERVAL_MS = 450; // how often progress advances
const DONE_HOLD_MS = 2500;        // how long the "DONE" message shows before advancing
const NEXT_ROUTE = 'CleanStoneChoiceScreen';

/* -------------------------------------------------------------------------- */
/*  HeaderMenu — static overflow (kebab) menu. No API / no dynamic data.       */
/*    Purely informational — this screen has no back button, since the        */
/*    cleaning process auto-advances and shouldn't be interrupted mid-cycle.  */
/* -------------------------------------------------------------------------- */
const HeaderMenu = () => {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const items = [
    { icon: 'help-circle', label: 'Help', onPress: () => setHelpOpen(true) },
  ];

  return (
    <>
      <IconButton
        name="more-vertical"
        variant="ghost"
        onPress={() => setOpen(true)}
        accessibilityLabel="More options"
      />

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setOpen(false)}>
          <View style={[styles.menuCard, { top: insets.top + layout.headerContentHeight + spacing.sm }]}>
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuItem,
                  i > 0 && styles.menuItemBorder,
                  pressed && { backgroundColor: colors.primaryTint },
                ]}
              >
                <Feather name={item.icon} size={18} color={colors.primary} style={{ marginRight: spacing.md }} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <AppDialog
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-circle"
        title="Help"
        message="The machine is cleaning itself. This finishes automatically — no action is needed until it's done."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  ProcessHero — layered visualization, matching CleaningHero's composition  */
/* -------------------------------------------------------------------------- */
const HERO = 260;
const center = (size) => (HERO - size) / 2;

const ProcessHero = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <View style={styles.ringStatic} />
      <Animated.View style={[styles.ringArc, { transform: [{ rotate }] }]} />
      <View style={styles.disc}>
        <Feather name="loader" size={48} color={colors.primary} />
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  DoneHero — same ring/glow language, in the success color                  */
/* -------------------------------------------------------------------------- */
const DoneHero = ({ checkScale }) => (
  <View style={styles.hero}>
    <View style={[styles.glow, { backgroundColor: colors.successTint || colors.primaryTint, opacity: 0.5 }]} />
    <View style={[styles.ringStatic, { borderColor: colors.successSubtle || colors.primarySubtle }]} />
    <View style={[styles.ringArc, { borderColor: colors.successTintBorder || colors.primaryTintBorder }]} />
    <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
      <Feather name="check" size={32} color={colors.textOnPrimary} />
    </Animated.View>
  </View>
);

const CleaningProcessScreen = ({ navigation }) => {
  // --- functionality preserved exactly ---
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('progress'); // 'progress' | 'done'
  const checkScale = useRef(new Animated.Value(0)).current;

  // Advance the progress bar until it hits 100
  useEffect(() => {
    if (phase !== 'progress') return undefined;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + PROGRESS_STEP, 100);
        if (next >= 100) clearInterval(interval);
        return next;
      });
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // Once progress hits 100, switch to the "done" phase
  useEffect(() => {
    if (progress >= 100 && phase === 'progress') {
      const toDone = setTimeout(() => setPhase('done'), 400);
      return () => clearTimeout(toDone);
    }
    return undefined;
  }, [progress, phase]);

  // Pop in the checkmark, then auto-advance after a hold period
  useEffect(() => {
    if (phase !== 'done') return undefined;
    Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    const advance = setTimeout(() => {
      if (navigation?.replace) navigation.replace(NEXT_ROUTE);
      else if (navigation?.navigate) navigation.navigate(NEXT_ROUTE);
    }, DONE_HOLD_MS);
    return () => clearTimeout(advance);
  }, [phase, checkScale, navigation]);

  if (phase === 'done') {
    return (
      <Screen background={colors.background} edges={['top', 'left', 'right', 'bottom']}>
        {/* No back button: the cycle has just finished and is auto-advancing. */}
        <MainHeader greeting="Machine Status" title="Cleaning Process" onBack={undefined} right={<HeaderMenu />} />

        <View style={styles.centerContent}>
          <DoneHero checkScale={checkScale} />
          <Text style={styles.title}>Self cleaning is done</Text>
          <Text style={styles.message}>Please discard the contents from the collection bowl.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen background={colors.background} edges={['top', 'left', 'right', 'bottom']}>
      {/* No back button: interrupting an in-progress cleaning cycle isn't allowed. */}
      <MainHeader greeting="Machine Status" title="Cleaning Process" onBack={undefined} right={<HeaderMenu />} />

      <View style={styles.content}>
        <ProcessHero />

        <Eyebrow style={{ marginTop: spacing.xxxl }}>Self-cleaning</Eyebrow>
        <Text style={styles.title}>Cleaning process</Text>
        <Text style={styles.percent}>{progress}% completed</Text>

        <ProgressBar value={progress} height={46} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />

        <StatusBadge label="Please wait" variant="info" icon="loader" style={{ marginTop: spacing.huge, alignSelf: 'center' }} />
      </View>
    </Screen>
  );
};

export default CleaningProcessScreen;

const styles = StyleSheet.create({
  // Overflow menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: layout.screenPaddingHorizontal,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },

  // Hero visualization (shared shape language with SelfCleaningScreen)
  hero: {
    width: HERO,
    height: HERO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 210,
    height: 210,
    top: center(210),
    left: center(210),
    borderRadius: 105,
    backgroundColor: colors.primaryTint,
  },
  ringStatic: {
    position: 'absolute',
    width: 198,
    height: 198,
    top: center(198),
    left: center(198),
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.primarySubtle,
  },
  ringArc: {
    position: 'absolute',
    width: 198,
    height: 198,
    top: center(198),
    left: center(198),
    borderRadius: 99,
    borderWidth: 6,
    borderColor: colors.primaryTintBorder,
    borderTopColor: colors.primary,
  },
  disc: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  },
  percent: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  message: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },
});