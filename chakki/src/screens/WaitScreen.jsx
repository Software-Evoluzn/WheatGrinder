import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  MainHeader,
  IconButton,
  FootNote,
  AppDialog,
} from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';

/* Static overflow (kebab) menu — no API / no dynamic data. */
const HeaderMenu = () => {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const items = [
    { icon: 'help-circle', label: 'Help', onPress: () => setHelpOpen(true) },
  ];

  return (
    <>
      <IconButton name="more-vertical" variant="ghost" onPress={() => setOpen(true)} accessibilityLabel="More options" />

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
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
        message="The machine is processing your request. Please wait, then tap the screen to continue."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  WaitHero — purple status visualization (rotating arc = active processing)   */
/* -------------------------------------------------------------------------- */
const HERO = 260;
const center = (size) => (HERO - size) / 2;

const WaitHero = () => {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });

  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <View style={styles.ringStatic} />
      <Animated.View style={[styles.ringArc, { transform: [{ rotate }] }]} />
      <View style={styles.disc}>
        <Feather name="cpu" size={46} color={colors.primary} />
      </View>
    </View>
  );
};

/* Status pill with a gentle pulsing dot. */
const StatusPill = ({ label }) => {
  const dot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [dot]);
  const opacity = dot.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const scale = dot.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  return (
    <View style={styles.statusPill}>
      <Animated.View style={[styles.dot, { opacity, transform: [{ scale }] }]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
};

const WaitScreen = ({ navigation }) => {
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('MillingControlScreen');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigation]);
  */

  const handleNavigate = () => {
    if (navigation?.navigate) {
      navigation.navigate('PauseScreen');
    }
  };

  return (
    <Screen background={colors.background}>
      {/* Header matches the flow screens: back + greeting/title + static menu. */}
      <MainHeader
        greeting="Machine Status"
        title="Processing"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      {/* Tap anywhere in the content to continue (existing behavior preserved). */}
      <Pressable style={{ flex: 1 }} onPress={handleNavigate} accessibilityRole="button">
        <View style={styles.content}>
          <WaitHero />

          <Text style={styles.title}>Please wait</Text>
          <Text style={styles.message}>The machine is processing your request.</Text>

          <StatusPill label="Processing" />

          <FootNote style={{ marginTop: spacing.xxl }}>Tap anywhere to continue</FootNote>
        </View>
      </Pressable>
    </Screen>
  );
};

export default WaitScreen;

const styles = StyleSheet.create({
  // Overflow menu
  menuOverlay: { flex: 1, backgroundColor: 'transparent' },
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
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  menuItemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  menuItemText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  // Hero visualization
  hero: { width: HERO, height: HERO, alignItems: 'center', justifyContent: 'center' },
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

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    letterSpacing: 0.2,
  },
  message: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: spacing.sm },
  statusText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
});