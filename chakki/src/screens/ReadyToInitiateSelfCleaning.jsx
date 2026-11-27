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
import {
  fetchRegisteredSerialNumber,
  sendDeviceCommand,
} from '../services/deviceApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

/* -------------------------------------------------------------------------- */
/*  HeaderMenu — static overflow (kebab) menu. No API / no dynamic data.       */
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
          <View
            style={[
              styles.menuCard,
              { top: insets.top + layout.headerContentHeight + spacing.sm },
            ]}
          >
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
                <Feather
                  name={item.icon}
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: spacing.md }}
                />
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
        message="Tap READY when the machine is set up and you want to start the self-cleaning cycle."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  ReadyHero — standalone cleaning illustration with subtle pulse             */
/* -------------------------------------------------------------------------- */
const ReadyHero = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.hero, { transform: [{ scale: scaleAnim }] }]}>
      <Image
        source={require('../assets/images/cleaning_gear.png')}
        style={styles.heroImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*  ReadyToInitiateSelfCleaning — READY publishes "selfCleaningProcess" via    */
/*    backend and navigates directly to CleaningProcessScreen.                 */
/* -------------------------------------------------------------------------- */
const ReadyToInitiateSelfCleaning = ({ navigation, route }) => {
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const serialNumber = route?.params?.serialNumber;
  const device = route?.params?.device;

  const handleReady = async () => {
    if (sending) return;
    setSending(true);

    try {
      let sn = serialNumber || (await AsyncStorage.getItem('serial_number'));

      if (!sn) {
        const customerId =
          (await AsyncStorage.getItem('customer_id')) ||
          route?.params?.customerId;
        if (!customerId) {
          throw new Error('User session not found. Please log in again.');
        }
        const serialRes = await fetchRegisteredSerialNumber(customerId);
        console.log('Serial response:', serialRes);
        if (!serialRes?.success) {
          throw new Error(serialRes?.error || 'No registered machine found');
        }
        sn = serialRes.serial_number;
        await AsyncStorage.setItem('serial_number', sn);
      }

      // Send MQTT command directly from here
      const response = await sendDeviceCommand(sn, 'selfCleaningProcess');
      if (response && response.success) {
        console.log('Command published successfully:', response);
      } else {
        console.warn('Failed or non-ok response from API:', response);
        // Optional: Uncomment the line below if you want to block navigation when API fails
        // throw new Error(response?.error || 'Failed to send self-cleaning command.');
      }

      // Navigate directly to CleaningProcessScreen
      navigation?.navigate?.('CleaningProcessScreen', {
        serialNumber: sn,
        device: device,
        freshStart: true,
      });
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen background={colors.background}>
      <DeviceOfflineGuard navigation={navigation} serialNumber={serialNumber} />

      <MainHeader
        greeting="Machine Status"
        title="Self-Cleaning"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      <View style={styles.content}>
        <ReadyHero />

        <Text style={styles.title}>Ready to start Self-Cleaning</Text>
        <Text style={styles.message}>
          Press READY to initiate the Self-Cleaning Process.
        </Text>

        <View style={styles.statusPill}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>
            {sending ? 'Sending command' : 'Ready'}
          </Text>
        </View>
      </View>

      <BottomActionBar>
        <PrimaryButton
          title={sending ? 'SENDING...' : 'READY'}
          icon={sending ? undefined : 'check'}
          onPress={handleReady}
          disabled={sending}
        />
      </BottomActionBar>

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

  hero: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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