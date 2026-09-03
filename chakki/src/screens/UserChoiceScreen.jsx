import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, Modal, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  MainHeader,
  IconButton,
  SelectableCard,
  PrimaryButton,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';

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
        message="Choose whether to set the flow rate or the grind texture, then tap SET to continue."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

const UserChoiceScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState(null); // 'flowRate' | 'texture' | null

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handlePressFlowRate = () => setSelectedOption('flowRate');
  const handlePressTexture = () => setSelectedOption('texture');

  const handleSet = () => {
    if (selectedOption === 'flowRate') {
      navigation.navigate('SetFlowRate');
    } else if (selectedOption === 'texture') {
      navigation.navigate('SetGrindTexture');
    } else {
      Alert.alert('Selection Required', 'Please select Flow Rate or Texture first.');
    }
  };

  return (
    <Screen background={colors.background}>
      {/* Header matches the flow screens: back + greeting/title + static menu. */}
      <MainHeader
        greeting="Machine Setup"
        title="User Choice"
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.body}>
        <Text style={styles.prompt}>What would you like to set?</Text>

        <View style={styles.cardsRow}>
          <SelectableCard
            selected={selectedOption === 'flowRate'}
            onPress={handlePressFlowRate}
            icon="droplet"
            label={selectedOption === 'flowRate' ? 'FLOW RATE\nSELECTED' : 'SET\nFLOW RATE'}
          />
          <SelectableCard
            selected={selectedOption === 'texture'}
            onPress={handlePressTexture}
            icon="sliders"
            label={selectedOption === 'texture' ? 'TEXTURE\nSELECTED' : 'SET\nTEXTURE'}
          />
        </View>
      </View>

      <BottomActionBar>
        <PrimaryButton title="SET" icon="arrow-right" onPress={handleSet} disabled={!selectedOption} />
      </BottomActionBar>
    </Screen>
  );
};

export default UserChoiceScreen;

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

  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl },
  prompt: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  cardsRow: { flexDirection: 'row', gap: spacing.lg },
});