import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  MainHeader,
  IconButton,
  PrimaryButton,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';
import DeviceOfflineGuard from '../components/DeviceOfflineGuard';

const BRAND_GREEN = '#7DC24d';

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

      {/* Themed help dialog (static content) */}
      <AppDialog
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-circle"
        title="Help"
        message="Attach the collection cloth to the machine's outlet so the ground flour is collected. Once it's secure, tap NEXT to continue."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  ClothHero — standalone illustration with no backdrop box or glow           */
/* -------------------------------------------------------------------------- */
const ClothHero = () => (
  <View style={styles.hero}>
    <Image
      source={require('../assets/images/collection_cloth.png')}
      style={styles.illustration}
      resizeMode="contain"
    />
  </View>
);

const CollectionClothScreen = ({ navigation, route }) => {
  // 2. Extract the serialNumber (or entire device object) from route params
  const serialNumber = route?.params?.serialNumber || route?.params?.device?.serial_number;
  const device = route?.params?.device;

  const handleNext = () => {
    if (navigation?.navigate) navigation.navigate('ReadyToInitiateSelfCleaning', {
      serialNumber: serialNumber,
      device: device
    });
  };

  return (
    <Screen background={colors.background}>
      {/* Header matches the flow screens: back + greeting/title + static menu. */}

      <DeviceOfflineGuard navigation={navigation} serialNumber={serialNumber} />

      <MainHeader
        greeting="Setup"
        title="Collection Cloth"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={<HeaderMenu />}
      />

      {/* Hero illustration -> title -> supporting text */}
      <View style={styles.content}>
        <ClothHero />

        <Text style={styles.title}>Please Ensure the Collection Cloth is Connected</Text>
        <Text style={styles.message}>Make sure it's securely attached before you continue.</Text>
      </View>

      <BottomActionBar>
        <PrimaryButton
          title="NEXT"
          icon="arrow-right"
          onPress={handleNext}
          buttonStyle={styles.nextButton}
        />
      </BottomActionBar>
    </Screen>
  );
};

export default CollectionClothScreen;

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

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  // Hero
  hero: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    maxWidth: 320,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  message: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },
  nextButton: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
});