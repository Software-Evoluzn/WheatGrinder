import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ActivityIndicator, BackHandler, Animated, Easing } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

import { Screen, MainHeader, IconButton, StatusBadge, AppDialog } from './ui';
import { colors, spacing, radii, shadows, typography, layout } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';
import IPCONFIG from '../services/ip.json';
import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

const SOCKET_URL = IPCONFIG.BASE_URL;
const PAUSE_TIMEOUT_MS = 120000; // 2 minute

/* Static overflow (kebab) menu */
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
        message="Tap START to load the grain and begin milling. Tap PAUSE to hold the process. Tap CHANGE TEXTURE to change the grind texture. Use the back arrow to return."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* Animated Control Button Component */
const ControlButton = ({ active, icon, label, onPress, disabled, iconNudge = 0, variant = 'default' }) => {
  const isStart = variant === 'start';

  // Animation values
  const pressScale = useRef(new Animated.Value(1)).current;
  const idlePulse = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isStart) return;

    let pulseLoop = null;
    let rippleLoop = null;

    if (active) {
      // Stop idle breathing
      idlePulse.setValue(1);

      // Start active expanding radar ring animation
      rippleScale.setValue(1);
      rippleOpacity.setValue(0.55);

      rippleLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.38,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      rippleLoop.start();
    } else if (!disabled) {
      // Reset active ripple
      rippleOpacity.setValue(0);
      rippleScale.setValue(1);

      // Subtle professional breathing pulse when ready to start
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(idlePulse, {
            toValue: 1.045,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(idlePulse, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      idlePulse.setValue(1);
      rippleOpacity.setValue(0);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (rippleLoop) rippleLoop.stop();
    };
  }, [isStart, active, disabled, idlePulse, rippleScale, rippleOpacity]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 25,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const iconColor = active
    ? '#FFFFFF'
    : isStart
      ? '#16A34A'
      : colors.textMuted;

  return (
    <View style={styles.controlItem}>
      <View style={styles.circleWrapper}>
        {/* Expanding Emerald Ripple Ring when START is running */}
        {isStart && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.rippleRing,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
        )}

        <Animated.View
          style={{
            transform: [
              { scale: pressScale },
              ...(isStart ? [{ scale: idlePulse }] : []),
            ],
          }}
        >
          <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, busy: disabled }}
            style={[
              styles.outerCircle,
              isStart
                ? active
                  ? styles.startOuterActive
                  : styles.startOuterDefault
                : active
                  ? styles.outerActive
                  : styles.outerDefault,
            ]}
          >
            <View
              style={[
                styles.innerCircle,
                isStart
                  ? active
                    ? styles.startInnerActive
                    : styles.startInnerDefault
                  : active && styles.innerActive,
              ]}
            >
              <Feather
                name={icon}
                size={34}
                color={iconColor}
                style={{ marginLeft: iconNudge }}
              />
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <Text
        style={[
          styles.controlLabel,
          isStart && !active && styles.startLabelDefault,
          active && (isStart ? styles.startLabelActive : styles.controlLabelActive),
        ]}
      >
        {label}
      </Text>
    </View>
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

const MillingControlScreen = ({ navigation, route }) => {
  const serialNumber = route?.params?.serialNumber;
  const grainId = String(route?.params?.grain || 'wheat');
  const selectedGrain = String(route?.params?.grainName || grainId);

  const rawTexture = route?.params?.texture;
  const selectedTexture =
    typeof rawTexture === 'string' && rawTexture ? rawTexture.toUpperCase() : 'FINE';
  const textureValue = route?.params?.textureValue;

  // Flow rate is only used for the "others" grain
  const flowRate = route?.params?.flowRate;
  const showFlowRate = grainId === 'others' && flowRate != null;

  const [processState, setProcessState] = useState(route?.params?.processState ?? null); // null | 'START' | 'PAUSE'
  const [pendingAction, setPendingAction] = useState(null); // null | 'START' | 'PAUSE'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backWarningOpen, setBackWarningOpen] = useState(false);

  const socketRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const serialRef = useRef(null);
  const allowNavigationRef = useRef(false);

  const sending = pendingAction !== null;
  const textureLocked = sending || isLoading;

  const isBackBlocked = processState === 'START' || sending || isLoading;

  const isBackBlockedRef = useRef(isBackBlocked);
  isBackBlockedRef.current = isBackBlocked;

  useEffect(() => {
    resolveSerialNumber(route)
      .then((sn) => { serialRef.current = sn; })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const incoming = route?.params?.processState;
    if (incoming !== undefined) setProcessState(incoming);
  }, [route?.params?.processState]);

  useEffect(() => {
    navigation?.setOptions?.({
      gestureEnabled: !isBackBlocked,
    });
  }, [navigation, isBackBlocked]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('beforeRemove', (e) => {
      if (allowNavigationRef.current || !isBackBlockedRef.current) {
        return;
      }

      const actionType = e?.data?.action?.type;
      if (actionType === 'RESET' || actionType === 'NAVIGATE' || actionType === 'REPLACE') {
        setBackWarningOpen(false);
        return;
      }

      e.preventDefault();
      setBackWarningOpen(true);
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (allowNavigationRef.current || !isBackBlockedRef.current) {
        return false;
      }
      setBackWarningOpen(true);
      return true;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      backHandler.remove();
    };
  }, [navigation]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to SocketIO server');
    });

    socket.on('connect_error', (e) => {
      console.log('Socket error:', e.message);
    });

    socket.on('pause_status_update', (data) => {
      console.log('Pause update:', data);

      const sn = serialRef.current?.toLowerCase();
      if (sn && data?.serial_number?.toLowerCase() !== sn) return;

      if (data?.status === 'pause_screen') {
        clearTimeout(pauseTimeoutRef.current);
        setIsLoading(false);
        setProcessState('PAUSE');
        setPendingAction(null);
      }
    });

    return () => {
      clearTimeout(pauseTimeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleBack = () => {
    if (isBackBlocked) {
      setBackWarningOpen(true);
      return;
    }
    if (navigation?.goBack) navigation.goBack();
  };

  const handleGoHome = () => {
    allowNavigationRef.current = true;
    navigation.navigate('Main');
  };

  const handleEditTexture = () => {
    if (textureLocked) return;
    allowNavigationRef.current = true;
    navigation.navigate('SetGrindTexture', {
      grain: grainId,
      grainName: route?.params?.grainName,
      textureValue,
      flowRate,                       // keep flow rate so it isn't lost
      serialNumber: route?.params?.serialNumber,
      fromMilling: true,
      processState,
    });
  };

  const publish = async (command) => {
    const sn = await resolveSerialNumber(route);

    console.log(`Sending ${command} to`, sn);
    const res = await sendDeviceCommand(sn, command);

    if (!res?.success) {
      throw new Error(res?.error || `Could not send ${command} to machine`);
    }
    return sn;
  };

  const handleToggleStart = async () => {
    if (sending || isLoading) return;
    setPendingAction('START');

    try {
      await publish('startGrinding');
      setProcessState('START');
    } catch (e) {
      setError({ title: "Couldn't start", message: e.message });
    } finally {
      setPendingAction(null);
    }
  };

  const handleTogglePause = async () => {
    if (sending || isLoading) return;

    if (processState === 'PAUSE') {
      setProcessState(null);
      return;
    }

    setPendingAction('PAUSE');
    setIsLoading(true);

    try {
      const sn = await resolveSerialNumber(route);
      serialRef.current = sn;

      socketRef.current?.emit('start_pause', { serial_number: sn });

      await publish('pauseGrinding');

      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setPendingAction(null);
        setError({
          title: 'No response',
          message: 'Machine did not confirm pause. Please try again.',
        });
      }, PAUSE_TIMEOUT_MS);
    } catch (e) {
      clearTimeout(pauseTimeoutRef.current);
      setIsLoading(false);
      setPendingAction(null);
      setError({ title: "Couldn't pause", message: e.message });
    }
  };

  const statusLabel =
    isLoading ? 'Please Wait...'
    : pendingAction === 'START' ? 'Starting'
    : pendingAction === 'PAUSE' ? 'Pausing'
    : processState === 'START' ? 'Running'
    : processState === 'PAUSE' ? 'Paused'
    : 'Ready';

  const backWarningTitle =
    pendingAction === 'PAUSE' || isLoading ? 'Pausing Machine' : 'Milling in Progress';

  const backWarningMessage =
    pendingAction === 'PAUSE' || isLoading
      ? 'The machine is currently pausing. Please wait until pause is confirmed before going back.'
      : 'The machine is currently running. Please tap PAUSE and wait for it to pause before going back.';

  return (
    <Screen background={colors.background}>
      {/* <DeviceOfflineGuard navigation={navigation} serialNumber={serialNumber} /> */}

      <MainHeader
        greeting="Machine Control"
        title="Milling"
        onBack={handleBack}
        right={
          <View style={styles.headerRight}>
            <IconButton
              name="home"
              variant="ghost"
              onPress={handleGoHome}
              accessibilityLabel="Go to home"
            />
            <HeaderMenu />
          </View>
        }
      />

      <View style={styles.body}>
        <StatusBadge
          label={statusLabel}
          variant={processState === 'PAUSE' ? 'warning' : 'info'}
          icon={processState === 'PAUSE' ? 'pause' : 'zap'}
          style={{ marginBottom: spacing.xxl }}
        />

        {/* 1. Texture level chip on top (slightly larger) */}
        <View style={styles.topTextureWrapper}>
          <View style={styles.textureChip}>
            <Feather name="sliders" size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.textureChipText}>
              {selectedTexture}
              {textureValue != null ? ` (LEVEL ${textureValue})` : ''}
            </Text>
          </View>
        </View>

        {/* 2. Grain chip on left, Change Texture button on right */}
        <View style={styles.actionRow}>
          <View style={styles.configChip}>
            <Feather name="box" size={15} color={colors.primary} style={{ marginRight: spacing.xs }} />
            <Text style={styles.configText} numberOfLines={1}>
              {selectedGrain.toUpperCase()}
            </Text>
          </View>

          <Pressable
            onPress={handleEditTexture}
            disabled={textureLocked}
            accessibilityRole="button"
            accessibilityLabel={`Current texture: ${selectedTexture}. Tap to change texture`}
            accessibilityState={{ disabled: textureLocked }}
            style={({ pressed }) => [
              styles.changeTextureBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              textureLocked && { opacity: 0.5 },
            ]}
          >
            <Feather name="sliders" size={16} color="#FFFFFF" style={{ marginRight: spacing.xs }} />
            <Text style={styles.changeTextureText} numberOfLines={1}>
              CHANGE TEXTURE
            </Text>
            <Feather name="chevron-right" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {showFlowRate && (
          <View style={styles.flowRow}>
            <View style={styles.configChip}>
              <Feather name="activity" size={14} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.configText}>FLOW {flowRate}%</Text>
            </View>
          </View>
        )}

        {/* 3. Prompt text */}
        <Text style={styles.prompt}>
          {isLoading ? 'Waiting for machine response...' : 'Choose an action to control milling'}
        </Text>

        {/* 4. Start and Pause buttons */}
        <View style={styles.controlsRow}>
          <ControlButton
            variant="start"
            active={processState === 'START'}
            disabled={sending || isLoading}
            icon="play"
            label="START"
            onPress={handleToggleStart}
            iconNudge={4}
          />
          <ControlButton
            active={processState === 'PAUSE'}
            disabled={sending || isLoading}
            icon="pause"
            label="PAUSE"
            onPress={handleTogglePause}
          />
        </View>
      </View>

      {/* Progress Dialog (Spinner Modal) */}
      <Modal
        transparent
        visible={isLoading}
        animationType="fade"
        onRequestClose={() => setBackWarningOpen(true)}
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderTitle}>Please Wait</Text>
            <Text style={styles.loaderSubtitle}>Communicating with machine...</Text>
          </View>
        </View>
      </Modal>

      {/* Back Warning Dialog */}
      <AppDialog
        visible={backWarningOpen}
        onClose={() => setBackWarningOpen(false)}
        icon="alert-triangle"
        title={backWarningTitle}
        message={backWarningMessage}
        confirmLabel="OK"
        onConfirm={() => setBackWarningOpen(false)}
      />

      {/* Error dialog */}
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
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

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },

  topTextureWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  textureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1.5,
    borderColor: colors.primaryTintBorder,
    ...shadows.subtle,
  },
  textureChipText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  flowRow: {
    alignItems: 'center',
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
  },
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
  },
  configText: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 },
  changeTextureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#15803D',
    ...shadows.subtle,
  },
  changeTextureText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  prompt: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 44 },
  controlItem: { alignItems: 'center' },
  circleWrapper: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#22C55E',
  },
  outerCircle: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  outerDefault: { backgroundColor: colors.primarySubtle, ...shadows.subtle },
  outerActive: { backgroundColor: colors.primary, ...shadows.button },
  innerCircle: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  innerActive: { backgroundColor: colors.primaryPressed },
  controlLabel: { marginTop: spacing.md, fontSize: 15, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5 },
  controlLabelActive: { color: colors.primary },

  // START button aesthetic green shades
  startOuterDefault: {
    backgroundColor: '#DCFCE7', // Soft mint halo
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  startOuterActive: {
    backgroundColor: '#22C55E', // Vibrant emerald outer ring
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 9,
  },
  startInnerDefault: {
    backgroundColor: '#F0FDF4', // Crisp light mint surface
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  startInnerActive: {
    backgroundColor: '#15803D', // Deep rich forest green core
    borderWidth: 1,
    borderColor: '#166534',
  },
  startLabelDefault: {
    color: '#16A34A',
  },
  startLabelActive: {
    color: '#15803D',
  },

  // Spinner Dialog Styles
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    ...shadows.card,
  },
  loaderTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loaderSubtitle: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});