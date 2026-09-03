import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, MainHeader, IconButton, StatusBadge, AppDialog } from './ui';
import { colors, spacing, radii, shadows, typography, layout } from './theme';

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
        message="Tap START to load the grain and begin milling. Tap PAUSE to hold the process. Use the back arrow to return."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

const MillingControlScreen = ({ navigation, route }) => {
  // --- functionality preserved exactly ---
  const selectedGrain = route?.params?.grainName || 'WHEAT';
  const selectedTexture = route?.params?.texture || 'FINE';

  const [processState, setProcessState] = useState(null); // null | 'START' | 'PAUSE'

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleToggleStart = () => {
    setProcessState('START');
    setTimeout(() => {
      navigation.navigate('LoadGrainToStart', {
        grainName: selectedGrain,
        texture: selectedTexture,
      });
    }, 200);
  };

  const handleTogglePause = () => {
    setProcessState((prev) => (prev === 'PAUSE' ? null : 'PAUSE'));
  };

  const Control = ({ active, icon, label, onPress, iconNudge = 0 }) => (
    <View style={styles.controlItem}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[styles.outerCircle, active ? styles.outerActive : styles.outerDefault]}
      >
        <View style={[styles.innerCircle, active && styles.innerActive]}>
          <Feather name={icon} size={34} color={active ? colors.textOnPrimary : colors.textMuted} style={{ marginLeft: iconNudge }} />
        </View>
      </Pressable>
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>{label}</Text>
    </View>
  );

  return (
    <Screen background={colors.background}>
      {/* Header matches the flow screens: back + greeting/title + static menu. */}
      <MainHeader
        greeting="Machine Control"
        title="Milling"
        onBack={handleBack}
        right={<HeaderMenu />}
      />

      <View style={styles.body}>
        <StatusBadge
          label={processState === 'START' ? 'Starting' : processState === 'PAUSE' ? 'Paused' : 'Ready'}
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
          <View style={styles.configChip}>
            <Feather name="sliders" size={14} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.configText}>{selectedTexture.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.prompt}>Choose an action to control milling</Text>

        <View style={styles.controlsRow}>
          <Control active={processState === 'START'} icon="play" label="START" onPress={handleToggleStart} iconNudge={4} />
          <Control active={processState === 'PAUSE'} icon="pause" label="PAUSE" onPress={handleTogglePause} />
        </View>
      </View>
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