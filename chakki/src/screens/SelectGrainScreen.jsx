import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Screen,
  MainHeader,
  IconButton,
  PrimaryButton,
  SecondaryButton,
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
        message="Pick the grain you want to grind, then tap NEXT to continue."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

const GRAINS = [
  { id: 'wheat', command: 'wheat', label: 'WHEAT', image: require('../assets/images/wheat.png') },
  { id: 'chana_dal', command: 'chanaDal', label: 'CHANA DAL', image: require('../assets/images/chana_dal.png') },
  { id: 'rice', command: 'rice', label: 'RICE', image: require('../assets/images/rice.png') },
  { id: 'ragi', command: 'ragi', label: 'RAGI', image: require('../assets/images/ragi.png') },
  { id: 'fada', command: 'fada', label: 'SPLITS (FADA)', image: require('../assets/images/splits.png') },
  { id: 'jowar', command: 'jowar', label: 'JOWAR', image: require('../assets/images/jowar.png') },
  { id: 'bajra', command: 'bajra', label: 'BAJRA', image: require('../assets/images/bajra.png') },
  { id: 'masala', command: 'masala', label: 'MASALA', image: require('../assets/images/masala.png') },
  { id: 'others', command: 'other', label: 'OTHERS', isOthers: true },
];

const resolveSerialNumber = async (route) => {
  // Priority 1: Route params
  const fromRoute = route?.params?.serialNumber;
  if (fromRoute) return fromRoute;

  // Priority 2: Stored Serial Number
  const stored = await AsyncStorage.getItem('serial_number');
  if (stored) return stored;

  // Priority 3: Fetch from Backend
  const customerId = (await AsyncStorage.getItem('customer_id')) || route?.params?.customerId;
  if (!customerId) {
    throw new Error('User session not found. Please log in again.');
  }

  const res = await fetchRegisteredSerialNumber(customerId);
  console.log('Serial response:', res);

  if (!res?.success && !res?.serial_number) {
    throw new Error(res?.error || 'No registered machine found');
  }

  const serial = res.serial_number || res.data?.serial_number;
  await AsyncStorage.setItem('serial_number', serial);
  return serial;
};

const SelectGrainScreen = ({ navigation, route }) => {
  const [selectedGrain, setSelectedGrain] = useState('wheat');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const serialNumber = route.params?.serialNumber;

  const handleCleanStone = async () => {
    if (sending) return;

    try {
      setSending(true);
      // const serialNumber = await resolveSerialNumber(route);
      // console.log('Opening CleaningProcess screen:', serialNumber);

      navigation.navigate('CleaningProcessScreen', { serialNumber });
    } catch (e) {
      console.log('Clean stone error:', e);
      setErrorMsg(e?.message || 'Could not find registered machine');
    } finally {
      setSending(false);
    }
  };

  const handleNext = async () => {
    if (sending) return;

    const grain = GRAINS.find((g) => g.id === selectedGrain);
    if (!grain) {
      setErrorMsg('Please select a grain.');
      return;
    }

    setSending(true);
    try {
      const serialNumber = await resolveSerialNumber(route);   // uncomment

      const res = await sendDeviceCommand(serialNumber, grain.command);
      const isSuccess = res?.success || res?.status === 'success' || res?.status === 200;
      if (!isSuccess) {
        throw new Error(res?.error || res?.message || 'Could not send grain selection to machine');
      }

      //Grain config fetch karein

      const grainConfig = getGrainConfig(grain.id);

      navigation.navigate('GrainConfirmationScreen', {
        serialNumber,
        grain: grain.id,
        grainCommand: grain.command,
        texture: grainConfig.default,
      });
    } catch (e) {
      setErrorMsg(e.message || 'Network error, please try again.');
    } finally {
      setSending(false);
    }
  };
  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting="Machine Setup"
        title="Select Grain"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Choose a grain to grind</Text>

        <View style={styles.grid}>
          {GRAINS.map((item) => {
            const isSelected = selectedGrain === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedGrain(item.id)}
                disabled={sending}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={[styles.thumbWrap, isSelected && styles.thumbWrapSelected]}>
                  {item.isOthers ? (
                    <Feather name="more-horizontal" size={24} color={isSelected ? colors.textOnPrimary : colors.primary} />
                  ) : (
                    <Image source={item.image} style={styles.thumb} resizeMode="contain" />
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.label, isSelected && styles.labelSelected]}>
                  {item.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkDot}>
                    <Feather name="check" size={12} color={colors.textOnPrimary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footer}>Powered by EVOLUZN</Text>
      </ScrollView>

      <BottomActionBar>
        <View style={styles.actions}>
          <SecondaryButton
            title="CLEAN STONE"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={handleCleanStone}
            disabled={sending}
          />
          <PrimaryButton
            title={sending ? 'SENDING...' : 'NEXT'}
            icon="arrow-right"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={handleNext}
            disabled={sending}
          />
        </View>
      </BottomActionBar>

      <AppDialog
        visible={!!errorMsg}
        onClose={() => setErrorMsg('')}
        icon="alert-circle"
        title="Couldn't select grain"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default SelectGrainScreen;

const CARD_GAP = spacing.md;
const styles = StyleSheet.create({
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

  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '31%',
    aspectRatio: 0.86,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: CARD_GAP,
    ...shadows.subtle,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  thumbWrapSelected: { backgroundColor: colors.surface },
  thumb: { width: 40, height: 40 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, textAlign: 'center' },
  labelSelected: { color: colors.primary },
  checkDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  footer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});