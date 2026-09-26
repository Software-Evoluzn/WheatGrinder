import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, MainHeader, IconButton, StatusBadge, AppDialog } from './ui';
import { colors, spacing, radii, shadows, typography, layout } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';

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
        message="Tap START to load the grain and begin milling. Tap PAUSE to hold the process. Tap the texture chip to change the grind texture. Use the back arrow to return."
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

const MillingControlScreen = ({ navigation, route }) => {
  // Read directly from route params (not useState) so the screen updates
  // automatically when SetGrindTexture sends back new values.
  const grainId = String(route?.params?.grain || 'wheat');
  const selectedGrain = String(route?.params?.grainName || grainId);

  // texture should be a label ('FINE' | 'MEDIUM' | 'COARSE'). Guard against a
  // number being passed by mistake, which would crash .toUpperCase().
  const rawTexture = route?.params?.texture;
  const selectedTexture =
    typeof rawTexture === 'string' && rawTexture ? rawTexture.toUpperCase() : 'FINE';
  const textureValue = route?.params?.textureValue; // numeric level

  // Previous screen can say the machine is already running (e.g. started from GrainConfirmation)
  const [processState, setProcessState] = useState(route?.params?.processState ?? null); // null | 'START' | 'PAUSE'
  const [pendingAction, setPendingAction] = useState(null); // null | 'START' | 'PAUSE' (request in flight)
  const [error, setError] = useState(null); // { title, message }

  const sending = pendingAction !== null;

  // Texture can't be changed while the machine is running or a command is in flight
  const textureLocked = sending || processState === 'START';

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  // Opens SetGrindTexture in edit mode; it comes back here with new params on SET
  const handleEditTexture = () => {
    if (textureLocked) return;
    navigation.navigate('SetGrindTexture', {
      grain: grainId,
      grainName: route?.params?.grainName,
      textureValue,
      serialNumber: route?.params?.serialNumber,
      fromMilling: true,
    });
  };

  /*
   * Publishes one MQTT command through the backend.
   * Returns the serial number on success; throws with a readable message on failure.
   */
  const publish = async (command) => {
    const serialNumber = await resolveSerialNumber(route);

    console.log(`Sending ${command} to`, serialNumber);
    const res = await sendDeviceCommand(serialNumber, command);
    console.log('Publish response:', res);

    if (!res?.success) {
      throw new Error(res?.error || `Could not send ${command} to machine`);
    }
    return serialNumber;
  };

  // START -> publish "startGrinding", then open LoadGrainToStart.
  // Also works as "resume" when the machine is paused.
  const handleToggleStart = async () => {
    if (sending) return;
    setPendingAction('START');

    try {
      const serialNumber = await publish('startGrinding');
      setProcessState('START');

      // navigation.navigate('LoadGrainToStart', {
      //   grainName: selectedGrain,
      //   texture: selectedTexture,
      //   textureValue,
      //   serialNumber,
      // });
    } catch (e) {
      setError({ title: "Couldn't start", message: e.message });
    } finally {
      setPendingAction(null);
    }
  };

  // PAUSE -> publish "pauseGrinding". Tapping again while paused only clears
  // the highlight; use START to resume the machine.
  const handleTogglePause = async () => {
    if (sending) return;

    if (processState === 'PAUSE') {
      setProcessState(null);
      return;
    }

    setPendingAction('PAUSE');
    try {
      await publish('pauseGrinding');
      setProcessState('PAUSE');
    } catch (e) {
      setError({ title: "Couldn't pause", message: e.message });
    } finally {
      setPendingAction(null);
    }
  };

  const Control = ({ active, icon, label, onPress, iconNudge = 0 }) => (
    <View style={styles.controlItem}>
      <Pressable
        onPress={onPress}
        disabled={sending}
        accessibilityRole="button"
        accessibilityState={{ selected: active, busy: sending }}
        style={[styles.outerCircle, active ? styles.outerActive : styles.outerDefault]}
      >
        <View style={[styles.innerCircle, active && styles.innerActive]}>
          <Feather name={icon} size={34} color={active ? colors.textOnPrimary : colors.textMuted} style={{ marginLeft: iconNudge }} />
        </View>
      </Pressable>
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>{label}</Text>
    </View>
  );

  const statusLabel =
    pendingAction === 'START' ? 'Starting'
    : pendingAction === 'PAUSE' ? 'Pausing'
    : processState === 'START' ? 'Running'
    : processState === 'PAUSE' ? 'Paused'
    : 'Ready';

  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting="Machine Control"
        title="Milling"
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.body}>
        <StatusBadge
          label={statusLabel}
          variant={processState === 'PAUSE' ? 'warning' : 'info'}
          icon={processState === 'PAUSE' ? 'pause' : 'zap'}
          style={{ marginBottom: spacing.xl }}
        />

        {/* Selected configuration (from route params) */}
        <View style={styles.configRow}>
          <View style={styles.configChip}>
            <Feather name="box" size={14} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.configText}>{selectedGrain.toUpperCase()}</Text>
          </View>

          {/* Editable texture chip -> opens SetGrindTexture */}
          <Pressable
            onPress={handleEditTexture}
            disabled={textureLocked}
            accessibilityRole="button"
            accessibilityLabel={`Texture: ${selectedTexture}. Tap to edit`}
            accessibilityState={{ disabled: textureLocked }}
            style={({ pressed }) => [
              styles.configChip,
              pressed && { opacity: 0.7 },
              textureLocked && { opacity: 0.5 },
            ]}
          >
            <Feather name="sliders" size={14} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.configText}>{selectedTexture}</Text>
            <Feather name="edit-2" size={13} color={colors.primary} style={{ marginLeft: spacing.sm }} />
          </Pressable>
        </View>

        <Text style={styles.prompt}>Choose an action to control milling</Text>

        <View style={styles.controlsRow}>
          <Control active={processState === 'START'} icon="play" label="START" onPress={handleToggleStart} iconNudge={4} />
          <Control active={processState === 'PAUSE'} icon="pause" label="PAUSE" onPress={handleTogglePause} />
        </View>
      </View>

      {/* Error dialog if serial lookup or MQTT publish fails */}
      <AppDialog
        visible={!!error}
        onClose={() => setError(null)}
        icon="alert-circle"
        title={error?.title || 'Something went wrong'}
        message={error?.message}
        confirmLabel="OK"
        onConfirm={() => setError(null)}
      />
    </Screen>
  );
};

export default MillingControlScreen;

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

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },

  // Config chips
  configRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.huge },
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
  },
  configText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },

  prompt: { ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.huge, textAlign: 'center' },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 44 },
  controlItem: { alignItems: 'center' },
  outerCircle: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  outerDefault: { backgroundColor: colors.primarySubtle, ...shadows.subtle },
  outerActive: { backgroundColor: colors.primary, ...shadows.button },
  innerCircle: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  innerActive: { backgroundColor: colors.primaryPressed },
  controlLabel: { marginTop: spacing.md, fontSize: 15, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 },
  controlLabelActive: { color: colors.primary },
});