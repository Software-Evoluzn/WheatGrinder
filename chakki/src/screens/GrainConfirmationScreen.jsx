import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Screen, MainHeader, SelectableCard, FootNote } from './ui';
import { colors, spacing, radii, shadows } from './theme';

const GrainConfirmationScreen = ({ navigation, route }) => {
  const grainId = route?.params?.grainId || 'wheat';
  const grainName = route?.params?.grainName || 'WHEAT';
  const defaultTexture = route?.params?.defaultTexture ?? 5;
  const maxLimit = route?.params?.maxLimit ?? 0;

  // Level ke hisab se label calculate karne ka function
  const getTextureLabel = (val) => {
    if (val <= 6) return 'FINE';
    if (val <= 14) return 'MEDIUM';
    return 'COARSE';
  };

  const textureLabel = route?.params?.texture || getTextureLabel(defaultTexture);
  const textureLevel = defaultTexture;

  const [selectedOption, setSelectedOption] = useState(null);

  const handleBack = () => {
    if (navigation?.goBack) navigation.navigate('SelectGrain');
  };

  const handleStartProcess = () => {
    setSelectedOption('start');
    navigation.navigate('MillingControlScreen', {
      grainId,
      grainName,
      texture: textureLabel,
      textureValue: textureLevel,
      maxLimit,
    });
  };

  const handleSetTexture = () => {
    setSelectedOption('texture');
    navigation.navigate('SetGrindTexture', {
      grainId,
      grainName,
      defaultTexture: textureLevel,
      maxLimit,
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

        {/* Highlighted Texture & Level Pill */}
        <View style={styles.texturePill}>
          <View style={styles.dot} />
          <Text style={styles.textureText}>
            TEXTURE · 
          </Text>
           {/* <Text style={styles.textureText}>
            TEXTURE · <Text style={styles.textureModeText}>{textureLabel.toUpperCase()}</Text>
          </Text> */}
          
          {/* Highlight Badge specifically for Level Value */}
          <View style={styles.levelBadge}>
            {/* <Text style={styles.levelLabelText}>LVL</Text> */}
            <Text style={styles.levelValueText}>{textureLevel}</Text>
          </View>
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

const BADGE = 130;

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
  
  // Highlight Pill Styles
  texturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginRight: spacing.md,
  },
  textureModeText: {
    fontWeight: '800',
    color: colors.primary,
  },
  
  // Specially highlighted level chip
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    gap: 4,
  },
  levelLabelText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primarySubtle,
    letterSpacing: 0.5,
  },
  levelValueText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.surface,
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