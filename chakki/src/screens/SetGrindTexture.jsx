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
import { getGrainConfig } from '../services/grainLevels';

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
          <View style={[styles.menuCard, { top: insets.top + (layout?.headerContentHeight || 56) + spacing.sm }]}>
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
                  style={{ marginRight: spacing.md, includeFontPadding: false }}
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
        message="Use + and – to adjust grind texture from fine to coarse, then tap SET to confirm."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

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
  if (!res?.success) {
    throw new Error(res?.error || 'No registered machine found');
  }

  await AsyncStorage.setItem('serial_number', res.serial_number);
  return res.serial_number;
};

const SetGrindTexture = ({ navigation, route }) => {
  const grainId = route?.params?.grainId || route?.params?.grain || 'wheat';
  const cfg = getGrainConfig(grainId);

  // true when opened from the Milling screen's edit chip
  const fromMilling = !!route?.params?.fromMilling;

  // Grain Display Name priority
  const grainDisplayName = route?.params?.grainName || cfg?.label || grainId.toUpperCase();

  // Numeric texture level: from Milling (textureValue), or a numeric `texture`
  // from the grain selection screen, else the grain's default.
  const initialTextureLevel =
    route?.params?.textureValue ??
    (typeof route?.params?.texture === 'number' ? route.params.texture : undefined) ??
    cfg?.default ??
    5;

  const [textureLevel, setTextureLevel] = useState(initialTextureLevel);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setTextureLevel(initialTextureLevel);
  }, [grainId, initialTextureLevel]);

  // Position of current texture level inside grain's min..max range
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

  const handleSet = async () => {
    if (sending) return;
    setSending(true);

    try {
      const serialNumber = await resolveSerialNumber(route);
      const res = await sendDeviceCommand(serialNumber, 'grindingLevel', { value: textureLevel });

      if (!res?.success) {
        throw new Error(res?.error || 'Could not send grinding level to machine');
      }

      const params = {
        grain: grainId,
        grainName: grainDisplayName,
        texture: getTextureLabel(),
        textureValue: textureLevel,
        serialNumber,
      };

      // merge: true -> if MillingControlScreen is already in the stack (edit flow),
      // go back to it and merge the new params instead of opening a second copy.
      // React Navigation v7: use navigation.popTo('MillingControlScreen', params, { merge: true })
      navigation.navigate({
        name: 'MillingControlScreen',
        params,
        merge: true,
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
        greeting="Machine Setup"
        title={grainDisplayName.toUpperCase()}
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      {/* Texture pill: DEFAULT on first setup, CURRENT when editing from Milling */}
      <View style={styles.texturePill}>
        <View style={styles.dot} />
        <Text style={styles.texturePillText}>
          {sending
            ? 'SETTING LEVEL...'
            : `${fromMilling ? 'CURRENT' : 'DEFAULT'} · ${getTextureLabel()}`}
        </Text>
      </View>

      <View style={styles.body}>
        <Eyebrow style={{ alignSelf: 'center' }}>Grinding Texture</Eyebrow>

        <View style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.ringStatic} />
          <View style={styles.ringArc} />
          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>{getTextureLabel()}</Text>
            <Text style={styles.valueSub}>Level {textureLevel}</Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <IconButton
            name="minus"
            onPress={handleDecrease}
            variant="ghost"
            size={24}
            disabled={sending}
            accessibilityLabel="Decrease texture"
          />
          <View style={styles.segments}>
            {Array.from({ length: segments }).map((_, i) => (
              <View
                key={i}
                style={[styles.segment, i < active && styles.segmentActive]}
              />
            ))}
          </View>
          <IconButton
            name="plus"
            onPress={handleIncrease}
            variant="ghost"
            size={24}
            disabled={sending}
            accessibilityLabel="Increase texture"
          />
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
const DIAL = 200;

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuCard: {
    position: 'absolute',
    right: layout?.screenPaddingHorizontal || spacing.lg,
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
    borderTopColor: colors.divider || colors.border,
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
    borderColor: colors.primaryTintBorder || colors.border,
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
    textTransform: 'uppercase',
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  /* --- HERO & CIRCULAR DIAL --- */
  hero: {
    width: HERO,
    height: HERO,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primaryTint,
  },
  ringStatic: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: colors.primarySubtle || colors.border,
  },
  ringArc: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 6,
    borderColor: colors.primaryTintBorder || colors.border,
  },
  valueCard: {
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primaryTintBorder || colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.card,
  },
  valueLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  valueSub: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    includeFontPadding: false,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.huge || spacing.xl,
    gap: spacing.md,
  },
  segments: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' },
  segment: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.primarySubtle || colors.border },
  segmentActive: { backgroundColor: colors.primary },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: 40 },
  scaleText: { ...typography.caption, color: colors.textMuted },
});