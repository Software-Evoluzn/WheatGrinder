import React, { useState, useEffect, useRef } from 'react';
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
  StepIndicator,
  Eyebrow,
  StatusIcon,
  Toggle,
  PrimaryButton,
  StatusBadge,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, typography, radii, shadows, layout } from './theme';

/* -------------------------------------------------------------------------- */
/*  HeaderMenu — static overflow (kebab) menu. No API / no dynamic data.       */
/*    Items are defined locally; "Help" opens a themed dialog with static text. */
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

      {/* Themed help dialog (static content) */}
      <AppDialog
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-circle"
        title="Help"
        message="Turn on the switch below and select your Wi-Fi network so your machine can receive settings and status updates."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  WifiHero — layered visualization, matching CleaningHero's composition     */
/* -------------------------------------------------------------------------- */
const HERO = 260;
const center = (size) => (HERO - size) / 2;

const WifiHero = ({ connected }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });

  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <View style={styles.ringStatic} />
      <View style={styles.ringArc} />
      <View style={styles.disc}>
        <StatusIcon icon="wifi" variant={connected ? 'success' : 'info'} size={64} />
      </View>
      <View style={styles.deviceChip}>
        <Feather name="cpu" size={16} color={colors.primary} />
      </View>
    </View>
  );
};

const ConnectWifiScreen = ({ navigation }) => {
  // --- functionality preserved exactly ---
  const [isWifiEnabled, setIsWifiEnabled] = useState(false);

  const toggleSwitch = () => setIsWifiEnabled((prev) => !prev);

  const handleNext = () => {
    if (navigation?.navigate) {
      navigation.navigate('CleaningProcessScreen');
    }
  };

  return (
    <Screen background={colors.background}>
      {/* Header: back + greeting/title (Home style) + static overflow menu. */}
      <MainHeader
        greeting="Machine Status"
        title="Wi-Fi Setup"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      <View style={styles.content}>
        <StepIndicator total={3} current={0} style={{ marginBottom: spacing.xxxl }} />

        {/* Hero composition: visual -> eyebrow -> title -> description */}
        <WifiHero connected={isWifiEnabled} />

        <Eyebrow style={{ marginTop: spacing.xxxl }}>Step 1 of 3</Eyebrow>
        <Text style={styles.title}>Connect your machine{'\n'}to Wi-Fi</Text>
        <Text style={styles.message}>
          A Wi-Fi connection lets your grinder receive settings and status updates
          during setup and operation.
        </Text>

        {/* Connection state — real functionality, restyled to match the pill/card language */}
        <View style={styles.stateCard}>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Wi-Fi connection</Text>
            <StatusBadge
              label={isWifiEnabled ? 'Connected' : 'Not connected'}
              variant={isWifiEnabled ? 'success' : 'info'}
              icon={isWifiEnabled ? 'check-circle' : 'circle'}
            />
          </View>
          <Toggle value={isWifiEnabled} onValueChange={toggleSwitch} style={{ marginTop: spacing.lg }} />
        </View>
      </View>

      <BottomActionBar>
        <PrimaryButton title="NEXT" icon="arrow-right" onPress={handleNext} />
      </BottomActionBar>
    </Screen>
  );
};

export default ConnectWifiScreen;

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
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },

  // Hero visualization
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
  deviceChip: {
    position: 'absolute',
    bottom: center(198) - 4,
    right: center(198) + 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
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

  stateCard: {
    alignSelf: 'stretch',
    marginTop: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.subtle,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  stateLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});