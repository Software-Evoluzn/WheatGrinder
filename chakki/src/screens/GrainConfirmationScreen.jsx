import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, MainHeader, FootNote, AppDialog } from './ui';
import { colors, spacing, radii, shadows } from './theme';
import { sendDeviceCommand, fetchRegisteredSerialNumber } from '../services/deviceApi';
import { getGrainConfig } from '../services/grainLevels';

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
        size={22}
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
      serialNumber,
    });
  };

  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting="Machine Setup"
        title={grainName.toUpperCase()}
        onBack={handleBack}
      />

      <View style={styles.body}>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <Feather name="check" size={35} color={colors.primary} style={styles.checkIcon} />
            </View>
          </View>
        </View>

        <View style={styles.texturePill}>
          <View style={[styles.dot, sending && styles.dotActive]} />
          <Text style={styles.textureText}>
            {sending ? 'COMMUNICATING...' : `Default Texture  •  ${textureLabel} (Level ${textureLevel})`}
          </Text>
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
        </View>
      </View>

      <View style={styles.footer}>
        <FootNote>Use back arrow to change selected grain</FootNote>
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

const BADGE_SIZE = 112;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  /* Hero Badge */
  badgeContainer: {
    marginBottom: spacing.lg,
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
    width: BADGE_SIZE - 28,
    height: BADGE_SIZE - 28,
    borderRadius: (BADGE_SIZE - 28) / 2,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  dotActive: {
    backgroundColor: colors.warning || '#E6A23C',
  },
  textureText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* Titles */
  promptContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subQuestion: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },

  /* Action Cards */
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  actionCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
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
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  actionIconWrapSelected: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  actionLabelSelected: {
    color: colors.primary,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionSubtitleSelected: {
    color: colors.primary,
    opacity: 0.8,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
});