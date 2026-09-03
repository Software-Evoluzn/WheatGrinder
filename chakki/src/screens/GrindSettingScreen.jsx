import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Screen, MainHeader, Eyebrow, IconButton, PrimaryButton, BottomActionBar } from './ui';
import { colors, spacing, radii, shadows, typography } from './theme';

const TOTAL_LEVEL_BARS = 18;

const GrindSettingScreen = ({ route, navigation }) => {
  // --- functionality preserved exactly ---
  const grainName = route?.params?.grainName || 'Premium Ragi Grains';
  const grainImage = route?.params?.grainImage || require('../assets/images/ragi.png');

  const [level, setLevel] = useState(12);

  const handleDecrease = () => {
    if (level > 1) setLevel((prev) => prev - 1);
  };
  const handleIncrease = () => {
    if (level < TOTAL_LEVEL_BARS) setLevel((prev) => prev + 1);
  };
  const handleYes = () => {
    if (navigation?.navigate) navigation.navigate('CleanStoneChoiceScreen');
  };

  return (
    <Screen background={colors.background}>
      {/* Header: same MainHeader structure/spacing as the rest of the flow.
          The avatar (existing, decorative) is kept in the right slot exactly
          as before, matching SelectGrainScreen — no HeaderMenu is added here
          since it wasn't part of the original screen. */}
      <MainHeader
        greeting="My Kitchen Tools"
        title="Grind Setting"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={
          <View style={styles.avatarCircle}>
            <Feather name="user" size={16} color={colors.textOnPrimary} />
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current ingredient */}
        <View style={styles.ingredientCard}>
          <View style={styles.ingredientThumb}>
            <Image source={grainImage} style={styles.grainImage} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>Current ingredient</Eyebrow>
            <Text style={styles.grainTitle}>{grainName}</Text>
          </View>
        </View>

        {/* Grind setting */}
        <View style={styles.settingCard}>
          <Text style={styles.settingHeader}>GRIND SETTING</Text>

          <View style={styles.labelRow}>
            <Text style={styles.edgeLabel}>COARSE</Text>
            <Text style={styles.levelValue}>Level {level}</Text>
            <Text style={styles.edgeLabel}>FINE</Text>
          </View>

          <View style={styles.controlRow}>
            <IconButton name="minus" onPress={handleDecrease} variant="solid" size={20} accessibilityLabel="Decrease level" />
            <View style={styles.barsContainer}>
              {Array.from({ length: TOTAL_LEVEL_BARS }).map((_, index) => (
                <View
                  key={index}
                  style={[styles.singleBar, index < level ? styles.filledBar : styles.unfilledBar]}
                />
              ))}
            </View>
            <IconButton name="plus" onPress={handleIncrease} variant="solid" size={20} accessibilityLabel="Increase level" />
          </View>
        </View>

        <Text style={styles.footer}>Powered by EVOLUZN</Text>
      </ScrollView>

      {/* Bottom action area: same fixed BottomActionBar treatment as the rest
          of the flow, instead of START scrolling with the content. */}
      <BottomActionBar>
        <PrimaryButton title="START" icon="play" onPress={handleYes} />
      </BottomActionBar>
    </Screen>
  );
};

export default GrindSettingScreen;

const styles = StyleSheet.create({
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  ingredientThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grainImage: { width: 52, height: 52 },
  grainTitle: { ...typography.title, color: colors.textPrimary, marginTop: 4 },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.lg,
    ...shadows.subtle,
  },
  settingHeader: { ...typography.eyebrow, color: colors.primary, marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  edgeLabel: { ...typography.caption, color: colors.textMuted },
  levelValue: { ...typography.subtitle, color: colors.primary, fontWeight: '800' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 40 },
  singleBar: { flex: 1, borderRadius: 3 },
  filledBar: { height: 34, backgroundColor: colors.primary },
  unfilledBar: { height: 16, backgroundColor: colors.primarySubtle },
  footer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});