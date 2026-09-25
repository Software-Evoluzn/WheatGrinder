import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, MainHeader, SelectableCard, FootNote, AppDialog } from './ui';
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
  console.log('Serial response:', res);
  if (!res?.success) {
    throw new Error(res?.error || 'No registered machine found');
  }

  await AsyncStorage.setItem('serial_number', res.serial_number);
  return res.serial_number;
};

const GrainConfirmationScreen = ({ navigation, route }) => {
  const serialNumber = route?.params?.serialNumber;
  const grainId = route?.params?.grain || 'wheat';

  // 1. Config se details aur default texture fetch karein
  const grainConfig = getGrainConfig(grainId);
  const grainName = route?.params?.grainName || grainConfig?.label || grainId.toUpperCase();

  // 2. Priority: Previous Screen Params -> Config Default Texture -> Fallback
  const texture = route?.params?.texture ?? grainConfig?.default ?? 5;

  console.log('GrainConfirmationScreen Route Params:', route?.params);
  console.log('Resolved Texture Level:', texture);

  const [selectedOption, setSelectedOption] = useState(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation.navigate('SelectGrain', { serialNumber });
  };

  // START -> publish "startGrinding", then open the milling control screen
  const handleStartProcess = async () => {
    if (sending) return;
    setSelectedOption('start');
    setSending(true);

    try {
      const serial = await resolveSerialNumber(route);

      console.log('Sending startGrinding to', serial);
      const res = await sendDeviceCommand(serial, 'startGrinding');
      console.log('Publish response:', res);

      if (!res?.success) {
        throw new Error(res?.error || 'Could not send start command to machine');
      }

      navigation.navigate('MillingControlScreen', {
        grain: grainName,
        texture: texture,
        serialNumber: serial,
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
      grain: grainName,
      grainId: grainId,
      texture: texture,
      serialNumber,
    });
  };

  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting="My Kitchen Tools"
        title={grainName.toUpperCase()}
        onBack={handleBack}
      />

      <View style={styles.body}>
        <View style={styles.badgeOuter}>
          <View style={styles.badgeInner}>
            <Feather name="check-circle" size={40} color={colors.primary} />
          </View>
        </View>

        {/* Dynamic Default Texture Display */}
        <View style={styles.texturePill}>
          <View style={styles.dot} />
          <Text style={styles.textureText}>
            {sending
              ? 'Starting grinding'
              : `Default Texture · Level ${texture}`}
          </Text>
        </View>

        <Text style={styles.question}>What would you like to do?</Text>

        <View style={styles.cardsRow}>
          <SelectableCard
            selected={selectedOption === 'start'}
            onPress={handleStartProcess}
            icon="play"
            label={sending ? 'SENDING...' : 'START'}
          />
          <SelectableCard
            selected={selectedOption === 'texture'}
            onPress={handleSetTexture}
            icon="sliders"
            label="TEXTURE"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <FootNote>Use the back button to choose a different grain</FootNote>
      </View>

      {/* Error dialog if serial lookup or MQTT publish fails */}
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

const BADGE = 140;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justify: 'center',
    paddingHorizontal: spacing.xxl,
  },

  badgeOuter: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justify: 'center',
  },
  badgeInner: {
    width: BADGE - 24,
    height: BADGE - 24,
    borderRadius: (BADGE - 24) / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justify: 'center',
    ...shadows.card,
  },

  texturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
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
  textureText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  question: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    letterSpacing: 0.2,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    justify: 'center',
  },

  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
});