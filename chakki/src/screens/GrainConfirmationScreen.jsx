import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Screen, MainHeader, SelectableCard, FootNote } from './ui';
import { colors, spacing, radii, shadows, typography } from './theme';

const GrainConfirmationScreen = ({ navigation, route }) => {
  // --- functionality preserved exactly ---
  const selectedGrain = route?.params?.grainName || 'WHEAT';
  const selectedTexture = route?.params?.texture || 'MEDIUM';

  const [selectedOption, setSelectedOption] = useState(null);

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleStartProcess = () => {
    setSelectedOption('start');
    navigation.navigate('MillingControlScreen', { grain: selectedGrain, texture: selectedTexture });
  };

  const handleSetTexture = () => {
    setSelectedOption('texture');
    navigation.navigate('UserChoiceScreen', { grain: selectedGrain });
  };

  return (
    <Screen background={colors.background}>
      {/* Header: same MainHeader structure/spacing as the rest of the flow.
          The dynamic grain name takes the title slot (short, like "Cleaning"
          or "Collection Cloth"); texture moves into a pill in the body below
          since it's a second piece of dynamic data, not a static eyebrow. */}
      <MainHeader
        greeting="My Kitchen Tools"
        title={selectedGrain.toUpperCase()}
        onBack={handleBack}
      />

      <View style={styles.body}>
        {/* Compact icon badge — no illustration asset exists for this step,
            so a smaller ring/glow accent keeps the same visual language
            without crowding the two selection cards below. */}
        <View style={styles.badgeOuter}>
          <View style={styles.badgeInner}>
            <Feather name="check-circle" size={40} color={colors.primary} />
          </View>
        </View>

        <View style={styles.texturePill}>
          <View style={styles.dot} />
          <Text style={styles.textureText}>Texture · {selectedTexture.toUpperCase()}</Text>
        </View>

        <Text style={styles.question}>What would you like to do?</Text>

        <View style={styles.cardsRow}>
          <SelectableCard
            selected={selectedOption === 'start'}
            onPress={handleStartProcess}
            icon="play"
            label="START"
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
    </Screen>
  );
};

export default GrainConfirmationScreen;

const BADGE = 140;
const badgeCenter = (size) => (BADGE - size) / 2;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  badgeOuter: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: BADGE - 24,
    height: BADGE - 24,
    borderRadius: (BADGE - 24) / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
  },

  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
});