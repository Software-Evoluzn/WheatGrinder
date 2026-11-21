import React, { useState } from 'react';
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
import { getGrainConfig } from '../services/grainLevels';
import { sendDeviceCommand } from '../services/deviceApi';
import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

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
        message="Use + and – to adjust how fast grain feeds into the grinder, then tap SET to confirm."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

const SetFlowRate = ({ navigation, route }) => {
  const grainId = route?.params?.grain || route?.params?.grainId || 'wheat';
  const grainConfig = getGrainConfig(grainId);

  const selectedGrain = route?.params?.grainName || grainConfig?.label || grainId.toUpperCase();
  const serialNumber = route?.params?.serialNumber;
  const selectedTexture = route?.params?.texture || 'FINE';
  const textureValue = route?.params?.textureValue;
  const fromMilling = route?.params?.fromMilling;
  const processState = route?.params?.processState;

  const minLimit = grainConfig?.minFlowRate ?? 10;
  const maxLimit = grainConfig?.maxFlowRate ?? 100;
  const defaultRate = grainConfig?.defaultFlowRate ?? 50;

  const initialRate = Number(route?.params?.flowRate ?? defaultRate);
  const [flowRate, setFlowRate] = useState(
    Math.min(maxLimit, Math.max(minLimit, initialRate))
  );
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleDecrease = () => setFlowRate((prev) => Math.max(minLimit, prev - 5));
  const handleIncrease = () => setFlowRate((prev) => Math.min(maxLimit, prev + 5));

  const handleSet = async () => {
    console.log('🔵 SET button pressed in SetFlowRate | flowRate:', flowRate);
    if (sending) return;
    setSending(true);

    try {
      const serial = serialNumber || (await AsyncStorage.getItem('serial_number'));
      console.log('🔵 Resolved serial:', serial);

      if (!serial) {
        throw new Error('Machine serial number not found.');
      }

      const res = await sendDeviceCommand(serial, 'grainFlow', { value: Number(flowRate) });
      console.log('🔵 sendDeviceCommand response:', res);

      const isSuccess = res?.success || res?.status === 'success' || res?.status === 200;
      if (!isSuccess) {
        throw new Error(res?.error || res?.message || 'Could not send flow rate to machine');
      }

      if (fromMilling) {
        navigation.navigate('MillingControlScreen', {
          grain: grainId,
          grainName: selectedGrain,
          texture: selectedTexture,
          textureValue,
          flowRate,
          serialNumber: serial,
          processState,
        });
      } else {
        navigation.navigate('GrainConfirmationScreen', {
          grain: grainId,
          grainName: selectedGrain,
          texture: textureValue,
          flowRate,
          serialNumber: serial,
        });
      }
    } catch (e) {
      console.log('🔴 SetFlowRate error:', e);
      setErrorMsg(e?.message || 'Failed to update flow rate.');
    } finally {
      setSending(false);
    }
  };

  const segments = 10;
  const active = Math.round(((flowRate - minLimit) / (maxLimit - minLimit)) * segments);

  return (
    <Screen background={colors.background}>
      <DeviceOfflineGuard navigation={navigation} serialNumber={serialNumber} />

      <MainHeader
        greeting="My Kitchen Tools"
        title={selectedGrain.toUpperCase()}
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.flowPill}>
        <View style={styles.dot} />
        <Text style={styles.flowPillText}>
          Flow rate · {flowRate}% (Default {defaultRate}%)
        </Text>
      </View>

      <View style={styles.body}>
        <Eyebrow style={{ alignSelf: 'center' }}>Grinding flow rate</Eyebrow>

        <View style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.ringStatic} />
          <View style={styles.ringArc} />
          <View style={styles.valueCard}>
            <Text style={styles.valueLabel}>{flowRate}%</Text>
            <Text style={styles.valueSub}>max {maxLimit}%</Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <IconButton
            name="minus"
            onPress={handleDecrease}
            disabled={sending}
            variant="ghost"
            size={24}
            accessibilityLabel="Decrease flow rate"
          />
          <View style={styles.segments}>
            {Array.from({ length: segments }).map((_, i) => (
              <View key={i} style={[styles.segment, i < active && styles.segmentActive]} />
            ))}
          </View>
          <IconButton
            name="plus"
            onPress={handleIncrease}
            disabled={sending}
            variant="ghost"
            size={24}
            accessibilityLabel="Increase flow rate"
          />
        </View>

        <View style={styles.scaleLabels}>
          <Text style={styles.scaleText}>{minLimit}%</Text>
          <Text style={styles.scaleText}>DEFAULT {defaultRate}%</Text>
          <Text style={styles.scaleText}>{maxLimit}%</Text>
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
        title="Couldn't set flow rate"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default SetFlowRate;

const HERO = 260;
const center = (size) => (HERO - size) / 2;
const DIAL = 200;

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

  flowPill: {
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
  flowPillText: {
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
  valueLabel: { fontSize: 44, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  valueSub: { ...typography.subtitle, color: colors.textSecondary, marginTop: 4 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.huge, gap: spacing.md },
  segments: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' },
  segment: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.primarySubtle },
  segmentActive: { backgroundColor: colors.primary },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: 40 },
  scaleText: { ...typography.caption, color: colors.textMuted },
});