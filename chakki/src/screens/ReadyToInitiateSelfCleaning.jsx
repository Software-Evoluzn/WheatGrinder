import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
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
  PrimaryButton,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        message="Tap READY when the machine is set up and you want to start the self-cleaning cycle."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  ReadyHero — layered visualization, matching CleaningHero's composition    */
/* -------------------------------------------------------------------------- */
const HERO = 260;
const center = (size) => (HERO - size) / 2;

const ReadyHero = () => {
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
        <Image
          source={require('../assets/images/cleaning_gear.png')}
          style={styles.discImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  ReadyToInitiateSelfCleaning — READY publishes "selfCleaningProcess" via    */
/*    backend (/api/mqtt/publish → <serial>/control), then navigates.          */
/* -------------------------------------------------------------------------- */
const ReadyToInitiateSelfCleaning = ({ navigation, route }) => {
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReady = async () => {
    if (sending) return;
    setSending(true);

    try {
      // 1. Get the machine's serial number
      //    (passed from previous screen, otherwise fetched from backend)
      // 1. Get the machine's serial number
      let serialNumber =
        route?.params?.serialNumber || (await AsyncStorage.getItem('serial_number'));

      if (!serialNumber) {
        const customerId = (await AsyncStorage.getItem('customer_id')) || route?.params?.customerId;
        if (!customerId) {
          throw new Error('User session not found. Please log in again.');
        }
        const serialRes = await fetchRegisteredSerialNumber(customerId);
        console.log('Serial response:', serialRes);
        if (!serialRes?.success) {
          throw new Error(serialRes?.error || 'No registered machine found');
        }
        serialNumber = serialRes.serial_number;
        await AsyncStorage.setItem('serial_number', serialNumber);
      }
      // 2. Publish the MQTT command through the backend
      console.log('Sending selfCleaningProcess to', serialNumber);
      const res = await sendDeviceCommand(serialNumber, 'selfCleaningProcess');
      console.log('Publish response:', res);

      if (!res?.success) {
        throw new Error(res?.error || 'Could not send command to machine');
      }

      // 3. Only move to the next screen after a successful publish
      navigation?.navigate?.('SelfCleaning', { serialNumber });
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen background={colors.background}>
      {/* Header: back + greeting/title (Home style) + static overflow menu. */}
      <MainHeader
        greeting="Machine Status"
        title="Self-Cleaning"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      {/* Hero composition: visual -> title -> description -> status */}
      <View style={styles.content}>
        <ReadyHero />

        <Text style={styles.title}>Ready to start self-cleaning</Text>
        <Text style={styles.message}>Press READY to initiate the self-cleaning process.</Text>

        <View style={styles.statusPill}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>{sending ? 'Sending command' : 'Ready'}</Text>
        </View>
      </View>

      <BottomActionBar>
        <PrimaryButton
          title={sending ? 'SENDING...' : 'READY'}
          icon="check"
          onPress={handleReady}
          disabled={sending}
        />
      </BottomActionBar>

      {/* Error dialog if serial fetch or MQTT publish fails */}
      <AppDialog
        visible={!!errorMsg}
        onClose={() => setErrorMsg('')}
        icon="alert-circle"
        title="Couldn't start cleaning"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default ReadyToInitiateSelfCleaning;

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
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
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
  discImage: {
    width: '65%',
    height: '65%',
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
});