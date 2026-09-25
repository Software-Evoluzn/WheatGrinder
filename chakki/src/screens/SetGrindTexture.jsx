import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Screen,
  MainHeader,
  IconButton,
  Eyebrow,
  PrimaryButton,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, radii, shadows, typography, layout } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';
import { getGrainConfig } from '../services/grainLevels'; // apna sahi path lagao

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
        message="Use + and – to adjust grind texture from fine to coarse, then tap SET to confirm."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/*
 * Finds the machine's serial number, in this order:
 *  1. passed from the previous screen (route param)
 *  2. saved on the phone (at registration or a previous lookup)
 *  3. fetched from the backend using the logged-in customer_id
 */
const resolveSerialNumber = async (route) => {
  const fromRoute = route?.params?.serialNumber;
  if (fromRoute) return fromRoute;

  const stored = await AsyncStorage.getItem('serial_number');
  if (stored) return stored;

  const customerId = (await AsyncStorage.getItem('customer_id')) || route?.params?.customerId;
  if (!customerId) {
    throw new Error('User session not found. Please log in again.');
  }

  const res = await fetchRegisteredSerialNumber(customerId);
  console.log('Serial response:', res);
  if (!res?.success) {
    throw new Error(res?.error || 'No registered machine found');
  }

  await AsyncStorage.setItem('serial_number', res.serial_number);
  return res.serial_number;
};

const SetGrindTexture = ({ navigation, route }) => {
  // GrainConfirmationScreen sends { grain } (id like 'chana_dal'), others may send { grainName }
  const grainId = route?.params?.grainName || route?.params?.grain || 'wheat';
  const cfg = getGrainConfig(grainId);

  const [textureLevel, setTextureLevel] = useState(cfg.default);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If the grain changes while this screen instance is reused, reset to that grain's default
  useEffect(() => {
    setTextureLevel(cfg.default);
  }, [grainId, cfg.default]);

  // Position of the current level inside this grain's min..max range (0 to 1)
  const pct = cfg.max > cfg.min ? (textureLevel - cfg.min) / (cfg.max - cfg.min) : 0;

  const getTextureLabel = () => {
    if (pct <= 0.3) return 'FINE';
    if (pct <= 0.7) return 'MEDIUM';
    return 'COARSE';
  };

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };
  const handleDecrease = () => setTextureLevel((prev) => Math.max(cfg.min, prev - 1));
  const handleIncrease = () => setTextureLevel((prev) => Math.min(cfg.max, prev + 1));

  // SET -> publish "grindingLevel:LEVEL", then open the milling control screen
  const handleSet = async () => {
    if (sending) return;
    setSending(true);

    try {
      const serialNumber = await resolveSerialNumber(route);

      console.log(`Sending grindingLevel:${textureLevel} to`, serialNumber);
      const res = await sendDeviceCommand(serialNumber, 'grindingLevel', { value: textureLevel });
      console.log('Publish response:', res);

      if (!res?.success) {
        throw new Error(res?.error || 'Could not send grinding level to machine');
      }

      navigation.navigate('MillingControlScreen', {
        grain: grainId,
        grainName: cfg.label,
        texture: getTextureLabel(),
        textureValue: textureLevel,
        serialNumber,
      });
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSending(false);
    }
  };

  const segments = 10;
  const active = Math.round(pct * segments);

  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting="My Kitchen Tools"
        title={cfg.label}
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.texturePill}>
        <View style={styles.dot} />
        <Text style={styles.texturePillText}>
          {sending ? 'Setting level' : `Texture · ${getTextureLabel()}`}
        </Text>
      </View>

      <View style={styles.body}>
        <Eyebrow style={{ alignSelf: 'center' }}>Grinding texture</Eyebrow>

        <View style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.ringStatic} />
          <View style={styles.ringArc} />
          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>{getTextureLabel()}</Text>
            <Text style={styles.valueSub}>{textureLevel}</Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <IconButton name="minus" onPress={handleDecrease} variant="ghost" size={24} accessibilityLabel="Decrease texture" />
          <View style={styles.segments}>
            {Array.from({ length: segments }).map((_, i) => (
              <View key={i} style={[styles.segment, i < active && styles.segmentActive]} />
            ))}
          </View>
          <IconButton name="plus" onPress={handleIncrease} variant="ghost" size={24} accessibilityLabel="Increase texture" />
        </View>

        <View style={styles.scaleLabels}>
          <Text style={styles.scaleText}>FINE</Text>
          <Text style={styles.scaleText}>MEDIUM</Text>
          <Text style={styles.scaleText}>COARSE</Text>
        </View>
      </View>

      <BottomActionBar>
        <PrimaryButton
          title={sending ? 'SENDING...' : 'SET'}
          icon="check"
          onPress={handleSet}
          disabled={sending}
        />
      </BottomActionBar>

      {/* Error dialog if serial lookup or MQTT publish fails */}
      <AppDialog
        visible={!!errorMsg}
        onClose={() => setErrorMsg('')}
        icon="alert-circle"
        title="Couldn't set texture"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default SetGrindTexture;

const HERO = 260;
const center = (size) => (HERO - size) / 2;
const DIAL = 200;

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

  texturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
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
  texturePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl },

  hero: {
    width: HERO,
    height: HERO,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 236,
    height: 236,
    top: center(236),
    left: center(236),
    borderRadius: 118,
    backgroundColor: colors.primaryTint,
  },
  ringStatic: {
    position: 'absolute',
    width: 222,
    height: 222,
    top: center(222),
    left: center(222),
    borderRadius: 111,
    borderWidth: 1,
    borderColor: colors.primarySubtle,
  },
  ringArc: {
    position: 'absolute',
    width: 222,
    height: 222,
    top: center(222),
    left: center(222),
    borderRadius: 111,
    borderWidth: 6,
    borderColor: colors.primaryTintBorder,
  },
  valueCard: {
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  valueLabel: { fontSize: 30, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  valueSub: { ...typography.subtitle, color: colors.textSecondary, marginTop: 4 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.huge, gap: spacing.md },
  segments: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' },
  segment: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.primarySubtle },
  segmentActive: { backgroundColor: colors.primary },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: 40 },
  scaleText: { ...typography.caption, color: colors.textMuted },
});