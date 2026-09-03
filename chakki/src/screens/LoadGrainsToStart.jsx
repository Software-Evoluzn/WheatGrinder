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
  StatusBadge,
  PrimaryButton,
  BottomActionBar,
  FootNote,
  AppDialog,
} from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';

const SUCCESS_BORDER = 'rgba(22,163,74,0.2)';

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
        message="Load the grain into the hopper, then tap START. The machine will stop automatically after stone cleaning."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  LoadHero — status visualization; tone shifts info -> success on start      */
/* -------------------------------------------------------------------------- */
const HERO = 260;
const center = (size) => (HERO - size) / 2;

const LoadHero = ({ started }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.5] });

  const main = started ? colors.success : colors.primary;
  const tint = started ? colors.successTint : colors.primaryTint;
  const border = started ? SUCCESS_BORDER : colors.primaryTintBorder;

  return (
    <View style={styles.hero}>
      <Animated.View
        style={[styles.glow, { backgroundColor: tint, transform: [{ scale: glowScale }], opacity: glowOpacity }]}
      />
      <View style={[styles.ringStatic, { borderColor: border }]} />
      <View style={styles.disc}>
        <Feather name={started ? 'check-circle' : 'package'} size={46} color={main} />
      </View>
    </View>
  );
};

const LoadGrainsToStart = ({ navigation, route }) => {
  // --- functionality preserved exactly ---
  const grainName = route?.params?.grainName || 'RICE';
  const texture = route?.params?.texture || 'FINE';
  const amount = route?.params?.amount || '200 Grams Rice';

  const [isStarted, setIsStarted] = useState(false);

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleStartProcess = () => {
    setIsStarted(true);
    setTimeout(() => {
      navigation.navigate('GrainOverScreen', { grainName, texture });
    }, 500);
  };

  return (
    <Screen background={colors.background}>
      {/* Header matches the flow screens: back + greeting/title + static menu. */}
      <MainHeader
        greeting="Machine Setup"
        title="Load Grain"
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.content}>
        <LoadHero started={isStarted} />

        <Text style={styles.title}>Load grain to start</Text>
        <Text style={styles.message}>Load {amount} and press start</Text>

        <StatusBadge
          label={isStarted ? 'Starting…' : `${grainName.toUpperCase()} · ${texture.toUpperCase()}`}
          variant={isStarted ? 'success' : 'info'}
          icon={isStarted ? 'loader' : 'info'}
          style={{ marginTop: spacing.xl }}
        />
      </View>

      <BottomActionBar>
        <PrimaryButton title="START" icon="play" onPress={handleStartProcess} loading={isStarted} />
        <FootNote style={{ marginTop: spacing.sm }}>Machine will stop after stone cleaning</FootNote>
      </BottomActionBar>
    </Screen>
  );
};

export default LoadGrainsToStart;

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
  },
  ringStatic: {
    position: 'absolute',
    width: 198,
    height: 198,
    top: center(198),
    left: center(198),
    borderRadius: 99,
    borderWidth: 6,
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
});