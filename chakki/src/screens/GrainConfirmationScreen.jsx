import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, MainHeader, AppDialog } from './ui';
import { colors, spacing, radii, shadows } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';
import { getGrainConfig } from '../services/grainLevels';
import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

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

// Same FINE / MEDIUM / COARSE rule used in SetGrindTexture
const getTextureLabel = (level, cfg) => {
  const min = cfg?.min ?? 0;
  const max = cfg?.max ?? 10;
  const pct = max > min ? (level - min) / (max - min) : 0;
  if (pct <= 0.3) return 'FINE';
  if (pct <= 0.7) return 'MEDIUM';
  return 'COARSE';
};

const ActionCard = ({ label, icon, selected, onPress, disabled, subtitle }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={({ pressed }) => [
      styles.actionCard,
      selected && styles.actionCardSelected,
      pressed && styles.actionCardPressed,
      disabled && styles.actionCardDisabled,
    ]}
  >
    <View style={[styles.actionIconWrap, selected && styles.actionIconWrapSelected]}>
      <Feather
        name={icon}
        size={24}
        color={selected ? colors.surface : colors.primary}
      />
    </View>
    <Text style={[styles.actionLabel, selected && styles.actionLabelSelected]}>
      {label}
    </Text>
    {subtitle ? (
      <Text style={[styles.actionSubtitle, selected && styles.actionSubtitleSelected]}>
        {subtitle}
      </Text>
    ) : null}
  </Pressable>
);

const GrainConfirmationScreen = ({ navigation, route }) => {
  const serialNumber = route?.params?.serialNumber;
  const grainId = route?.params?.grain || 'wheat';

  const grainConfig = getGrainConfig(grainId);
  const grainName = route?.params?.grainName || grainConfig?.label || grainId.toUpperCase();

  // Numeric texture level (e.g. 5)
  const textureLevel = Number(route?.params?.texture ?? grainConfig?.default ?? 5);
  const textureLabel = getTextureLabel(textureLevel, grainConfig);
  const isTextureCustomized = !!route?.params?.isTextureCustomized;

  // Flow rate (only meaningful for the "others" grain). Set via SetFlowRate screen.
  const flowRate = route?.params?.flowRate;
  const showFlowRate = grainId === 'others' && flowRate != null;

  const [selectedOption, setSelectedOption] = useState(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Clear the highlighted card when the user comes back to this screen
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => setSelectedOption(null));
    return unsubscribe;
  }, [navigation]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation.navigate('SelectGrain', { serialNumber });
  };

  const handleStartProcess = async () => {
    if (sending) return;
    setSelectedOption('start');
    setSending(true);

    try {
      const serial = await resolveSerialNumber(route);
      const res = await sendDeviceCommand(serial, 'startGrinding');

      if (!res?.success) {
        throw new Error(res?.error || 'Could not send start command to machine');
      }

      navigation.navigate('MillingControlScreen', {
        grain: grainId,              // id, used by SetGrindTexture / getGrainConfig
        grainName,                   // display name
        texture: textureLabel,       // label string: 'FINE' | 'MEDIUM' | 'COARSE'
        textureValue: textureLevel,  // numeric level
        flowRate,                    // numeric flow rate (only set for "others")
        serialNumber: serial,
        processState: 'START',       // machine is already running
      });
    } catch (e) {
      setSelectedOption(null);
      setErrorMsg(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleSetTexture = () => {
    if (sending) return;
    setSelectedOption('texture');
    navigation.navigate('SetGrindTexture', {
      grain: grainId,
      grainId,
      grainName,
      textureValue: textureLevel,
      flowRate,                      // keep flow rate so it isn't lost
      serialNumber,
      fromMilling: false,
    });
  };

  const handleSetFlowRate = () => {
    if (sending) return;

    setSelectedOption('flowRate');

    navigation.navigate('SetFlowRate', {
      grain: grainId,
      grainId,
      grainName,
      textureValue: textureLevel,    // keep texture so it isn't lost
      isTextureCustomized,
      flowRate,                      // current flow rate (if already set)
      serialNumber,
      fromMilling: false,
    });
  };

  const pillText = sending
    ? 'COMMUNICATING...'
    : `${isTextureCustomized ? 'Selected Texture' : 'Default Texture'}  •  ${textureLabel} (Level ${textureLevel})` +
      (showFlowRate ? `  •  Flow ${flowRate}%` : '');

  return (
    <Screen background={colors.background}>
      <DeviceOfflineGuard navigation={navigation} serialNumber={serialNumber} />

      <MainHeader
        greeting="Machine Setup"
        title={grainName.toUpperCase()}
        onBack={handleBack}
      />

      <View style={styles.body}>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <Feather name="check" size={38} color={colors.primary} style={styles.checkIcon} />
            </View>
          </View>
        </View>

        <View style={styles.texturePill}>
          <View style={[styles.dot, sending && styles.dotActive]} />
          <Text style={styles.textureText}>{pillText}</Text>
        </View>

        <View style={styles.promptContainer}>
          <Text style={styles.question}>Ready to Grind?</Text>
          <Text style={styles.subQuestion}>
            Start immediately with default settings or adjust grind texture.
          </Text>
        </View>

        <View style={styles.cardsRow}>
          <ActionCard
            selected={selectedOption === 'start'}
            onPress={handleStartProcess}
            icon="play"
            label={sending ? 'SENDING...' : 'START'}
            subtitle="Begin grinding now"
            disabled={sending}
          />
          <ActionCard
            selected={selectedOption === 'texture'}
            onPress={handleSetTexture}
            icon="sliders"
            label="TEXTURE"
            subtitle="Adjust coarseness"
            disabled={sending}
          />
          {grainId === 'others' && (
            <ActionCard
              selected={selectedOption === 'flowRate'}
              onPress={handleSetFlowRate}
              icon="activity"
              label="FLOW RATE"
              subtitle="Adjust grain flow"
              disabled={sending}
            />
          )}
        </View>

        <Text style={styles.helperText}>Use back arrow to change selected grain</Text>
      </View>

      <AppDialog
        visible={!!errorMsg}
        onClose={() => setErrorMsg('')}
        icon="alert-circle"
        title="Couldn't start grinding"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default GrainConfirmationScreen;

const BADGE_SIZE = 122;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  /* Hero Badge */
  badgeContainer: {
    marginBottom: spacing.md,
    transform: [{ translateY: -34 }],
  },
  badgeOuter: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryTintBorder || colors.border,
  },
  badgeInner: {
    width: BADGE_SIZE - 30,
    height: BADGE_SIZE - 30,
    borderRadius: (BADGE_SIZE - 30) / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  checkIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  /* Status Pill */
  texturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  dotActive: {
    backgroundColor: colors.warning || '#E6A23C',
  },
  textureText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* Titles */
  promptContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  question: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subQuestion: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },

  /* Three Action Cards */
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'stretch',
  },

  actionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 132,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },

  actionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },

  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  actionCardDisabled: {
    opacity: 0.6,
  },

  /* Action Card Icons */
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  actionIconWrapSelected: {
    backgroundColor: colors.primary,
  },

  /* Action Card Labels */
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  actionLabelSelected: {
    color: colors.primary,
  },

  actionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 15,
  },

  actionSubtitleSelected: {
    color: colors.primary,
    opacity: 0.8,
  },

  /* Helper Text below cards */
  helperText: {
    marginTop: spacing.xl,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});