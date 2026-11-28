
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import IP_CONFIG from '../services/ip.json';
import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

import {
  Screen,
  MainHeader,
  IconButton,
  Eyebrow,
  ProgressBar,
  AppDialog,
  BottomActionBar,
} from './ui';

import {
  colors,
  spacing,
  typography,
  radii,
  shadows,
  layout,
} from './theme';

const BRAND_GREEN = '#7DC24d';
const SOCKET_URL = IP_CONFIG.BASE_URL;
const NEXT_ROUTE = 'SelectGrain';

/* -------------------------------------------------------------------------- */
/* HeaderMenu                                                                 */
/* -------------------------------------------------------------------------- */

const HeaderMenu = () => {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const items = [
    {
      icon: 'help-circle',
      label: 'Help',
      onPress: () => setHelpOpen(true),
    },
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
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                top:
                  insets.top +
                  layout.headerContentHeight +
                  spacing.sm,
              },
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
                  pressed && {
                    backgroundColor: colors.primaryTint,
                  },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: spacing.md }}
                />

                <Text style={styles.menuItemText}>
                  {item.label}
                </Text>
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
        message="The machine is cleaning itself. This finishes automatically — no action is needed until it's done."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* ProcessHero                                                                */
/* -------------------------------------------------------------------------- */

const HERO = 260;
const center = (size) => (HERO - size) / 2;

const ProcessHero = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.08],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.55],
  });

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.hero}>
      <Animated.View
        style={[
          styles.glow,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      <View style={styles.ringStatic} />

      <Animated.View
        style={[
          styles.ringArc,
          {
            transform: [{ rotate }],
          },
        ]}
      />

      <View style={styles.disc}>
        <Feather
          name="loader"
          size={48}
          color={colors.primary}
        />
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* DoneHero                                                                   */
/* -------------------------------------------------------------------------- */

const DoneHero = ({ checkScale }) => (
  <View style={styles.hero}>
    <View
      style={[
        styles.glow,
        {
          backgroundColor:
            colors.successTint || colors.primaryTint,
          opacity: 0.5,
        },
      ]}
    />

    <View
      style={[
        styles.ringStatic,
        {
          borderColor:
            colors.successSubtle || colors.primarySubtle,
        },
      ]}
    />

    <View
      style={[
        styles.ringArc,
        {
          borderColor:
            colors.successTintBorder ||
            colors.primaryTintBorder,
        },
      ]}
    />

    <Animated.View
      style={[
        styles.checkCircle,
        {
          transform: [{ scale: checkScale }],
        },
      ]}
    >
      <Feather
        name="check"
        size={32}
        color={colors.textOnPrimary}
      />
    </Animated.View>
  </View>
);

/* -------------------------------------------------------------------------- */
/* Main Screen Component                                                      */
/* -------------------------------------------------------------------------- */

const CleaningProcessScreen = ({ navigation, route }) => {
  const { serialNumber, device, freshStart } =
    route.params || {};

  const startSentRef = useRef(false);

  const [phase, setPhase] = useState('progress');
  const [progress, setProgress] = useState(0);

  const checkScale = useRef(
    new Animated.Value(0)
  ).current;

  const [backWarningOpen, setBackWarningOpen] =
    useState(false);

  const allowNavigationRef = useRef(false);

  /* ------------------------------------------------------------------------ */
  /* Existing Back Navigation Protection                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    navigation?.setOptions?.({
      gestureEnabled: false,
      headerLeft: () => null,
    });

    const unsubscribe = navigation?.addListener?.(
      'beforeRemove',
      (e) => {
        if (allowNavigationRef.current) {
          return;
        }

        const actionType = e?.data?.action?.type;

        if (
          actionType === 'RESET' ||
          actionType === 'NAVIGATE' ||
          actionType === 'REPLACE'
        ) {
          allowNavigationRef.current = true;
          setBackWarningOpen(false);
          return;
        }

        e.preventDefault();
        setBackWarningOpen(true);
      }
    );

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (allowNavigationRef.current) {
          return false;
        }

        setBackWarningOpen(true);
        return true;
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      backHandler.remove();
    };
  }, [navigation]);

  /* ------------------------------------------------------------------------ */
  /* Existing Real-time Socket Listener                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    const normalizeSerial = (value) =>
      String(value || '')
        .replace(/[{}]/g, '')
        .trim()
        .toLowerCase();

    const handleCleaningUpdate = (data) => {
      console.log(
        '⚡ Cleaning status received:',
        data
      );

      const incomingId = normalizeSerial(
        data?.serial_number
      );

      const currentId = normalizeSerial(serialNumber);

      // Check if message belongs to current device
      const isSameDevice =
        !currentId ||
        incomingId === currentId ||
        incomingId.includes(currentId) ||
        currentId.includes(incomingId);

      if (!isSameDevice) return;

      // Live percentage update
      if (
        data?.status === 'cleaning_progress' &&
        typeof data?.progress === 'number'
      ) {
        const pct = Math.max(
          0,
          Math.min(100, data.progress)
        );

        setProgress(pct);
      }

      // Final cleaning done message
      if (data?.status === 'cleaning_done') {
        console.log('✅ SELF CLEANING DONE');

        setProgress(100);
        setPhase('done');
      }
    };

    socket.on('connect', () => {
      console.log(
        '⚡ Socket connected:',
        socket.id
      );

      if (serialNumber) {
        // Clear old cleaning status for a fresh start
        if (freshStart && !startSentRef.current) {
          startSentRef.current = true;

          socket.emit('start_cleaning', {
            serial_number: serialNumber,
          });
        }

        socket.emit('check_cleaning', {
          serial_number: serialNumber,
        });
      }
    });

    socket.on(
      'cleaning_status_update',
      handleCleaningUpdate
    );

    socket.on('connect_error', (error) => {
      console.log(
        '❌ Socket connection error:',
        error.message
      );
    });

    return () => {
      console.log('🔌 Cleaning socket disconnected');

      socket.off(
        'cleaning_status_update',
        handleCleaningUpdate
      );

      socket.disconnect();
    };
  }, [serialNumber]);

  /* ------------------------------------------------------------------------ */
  /* Done Animation — No Automatic Navigation                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (phase !== 'done') return undefined;

    Animated.spring(checkScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [phase, checkScale]);

  /* ------------------------------------------------------------------------ */
  /* Manual NEXT Button Navigation                                            */
  /* ------------------------------------------------------------------------ */

  const handleNext = () => {
    if (
      phase !== 'done' ||
      allowNavigationRef.current
    ) {
      return;
    }

    allowNavigationRef.current = true;

    setBackWarningOpen(false);

    const targetParams = {
      serialNumber,
      device,
    };

    if (navigation?.replace) {
      navigation.replace(
        NEXT_ROUTE,
        targetParams
      );
    } else if (navigation?.navigate) {
      navigation.navigate(
        NEXT_ROUTE,
        targetParams
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* DONE VIEW                                                                */
  /* ------------------------------------------------------------------------ */

  if (phase === 'done') {
    return (
      <Screen
        background={colors.background}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <DeviceOfflineGuard
          navigation={navigation}
          serialNumber={serialNumber}
        />

        <MainHeader
          greeting="Machine Status"
          title="CLEANING PROCESS"
          onBack={undefined}
          right={<HeaderMenu />}
        />

        <View style={styles.centerContent}>
          <DoneHero checkScale={checkScale} />

          <Text style={styles.title}>
            Self Cleaning is done
          </Text>

          {/* Highlighted Orange Discard Alert */}

          <View style={styles.discardNotice}>
            <Feather
              name="alert-circle"
              size={26}
              color="#B45309"
              style={styles.discardIcon}
            />

            <Text style={styles.discardText}>
              Please discard the contents from the
              collection bowl.
            </Text>
          </View>
        </View>

        {/* Green NEXT Button */}

        <BottomActionBar
          lift={0}
          divider={false}
          style={styles.doneBottomBar}
        >
          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel="Next, select grain"
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
          >
            <Text style={styles.nextButtonText}>
              NEXT
            </Text>

            <Feather
              name="arrow-right"
              size={22}
              color="#FFFFFF"
              style={styles.nextButtonIcon}
            />
          </Pressable>
        </BottomActionBar>

        {/* Completed Screen Back Warning */}

        <AppDialog
          visible={backWarningOpen}
          onClose={() => setBackWarningOpen(false)}
          icon="alert-triangle"
          title="Cleaning Completed"
          message="Please discard the contents from the collection bowl and tap NEXT to continue."
          confirmLabel="OK"
          onConfirm={() => setBackWarningOpen(false)}
        />
      </Screen>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* PROGRESS VIEW                                                            */
  /* ------------------------------------------------------------------------ */

  return (
    <Screen
      background={colors.background}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <DeviceOfflineGuard
        navigation={navigation}
        serialNumber={serialNumber}
      />

      <MainHeader
        greeting="Machine Status"
        title="Cleaning Process"
        onBack={undefined}
        right={<HeaderMenu />}
      />

      <View style={styles.content}>
        <ProcessHero />

        <Eyebrow
          style={{ marginTop: spacing.xxxl }}
        >
          Self-Cleaning
        </Eyebrow>

        <Text style={styles.title}>
          Cleaning Process
        </Text>

        <Text style={styles.percent}>
          {progress}% completed
        </Text>

        <ProgressBar
          value={progress}
          height={46}
          fillColor={BRAND_GREEN}
          style={{
            marginTop: spacing.xl,
            alignSelf: 'stretch',
          }}
        />

        {/* UPDATED: Larger Please Wait Badge */}

        <View style={styles.pleaseWaitBadge}>
          <Feather
            name="loader"
            size={26}
            color={colors.primary}
          />

          <Text style={styles.pleaseWaitText}>
            Please wait
          </Text>
        </View>
      </View>

      <AppDialog
        visible={backWarningOpen}
        onClose={() => setBackWarningOpen(false)}
        icon="alert-triangle"
        title="Cleaning in Progress"
        message="Self-Cleaning is currently running. Please wait until the process finishes."
        confirmLabel="OK"
        onConfirm={() => setBackWarningOpen(false)}
      />
    </Screen>
  );
};

export default CleaningProcessScreen;

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

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
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },

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

  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  },

  percent: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.md,
  },

  message: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },

  /* ------------------------------------------------------------------------ */
  /* UPDATED: Larger Please Wait Badge                                        */
  /* ------------------------------------------------------------------------ */

  pleaseWaitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primaryTint,
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: spacing.huge,
    gap: 10,
  },

  pleaseWaitText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },

  /* ------------------------------------------------------------------------ */
  /* Highlighted Orange Discard Alert                                         */
  /* ------------------------------------------------------------------------ */

  discardNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },

  discardIcon: {
    marginRight: spacing.md,
  },

  discardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    lineHeight: 24,
  },

  /* ------------------------------------------------------------------------ */
  /* Green NEXT Button                                                        */
  /* ------------------------------------------------------------------------ */

  doneBottomBar: {
    paddingTop: 4,
    paddingBottom: 4,
  },

  nextButton: {
    width: '100%',
    minHeight: 54,
    backgroundColor: BRAND_GREEN,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  nextButtonPressed: {
    opacity: 0.85,
  },

  nextButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  nextButtonIcon: {
    marginLeft: spacing.sm,
  },
});
